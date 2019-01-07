/*
*
* Request handlers 
*
*
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const util = require ('util');

// Debud the module
const debug = util.debuglog('handlers');


// Define the handlers
const handlers = {};

// Users
handlers.users = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback)

    } else {
        callback(405);
    };

}
// Containe users handlers
handlers._users = {};

// Users -- post
// Required data: firstname, lastname, phone, password, tosAgreement
// Optional data: none

handlers._users.post = function (data, callback) {
    // Check all required fields are filled out
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string'
        && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : false;
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == 'true' ? true : true;


    if (firstName && lastName && phone && password && tosAgreement) {
        // Make shure that user doesnt already exists
        _data.read('users', phone, function (err, data) {
            if (err) {
                // Hash the password
                const hashPassword = helpers.hash(password);
                // Create the user object
                if (hashPassword) {
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'password': hashPassword,
                        'tosAgreement': true
                    }
                    // Storing the user
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200, userObject);
                        } else {
                            debug(err);
                            callback(500, { 'error': 'Could not create the new user' });
                        }
                    });
                } else {
                    callback(500, { 'error': 'Could not create hash to the password new user' });
                }
            } else {
                // If phone user already exist
                callback(400, { 'error': 'User already exists' });
            }
        });
    } else {
        callback(400, { 'error': 'Missing required fields' });
    }
};

// Users -- get
// Required field [phone]
// Optional data none

handlers._users.get = function (data, callback) {
    // Check if the phone provider is valid
    const phone = typeof (data.queryString.phone) == 'string' && data.queryString.phone.trim() > 0 ? data.queryString.phone.trim() : false;

    if (phone) {

        // Get token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify if given token is valid with phone

        handlers._tokens.verifyTokens(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lockup the user
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        // Remove the password hash before to send user data
                        delete data.password;
                        callback(200, data);
                    } else {
                        callback(400, { 'error': 'Phone number  user doesn\'t exists' });
                    }
                });
            } else {
                callback(403, { 'error': 'missing required token in header, or token is invalid' })
            }
        });
    } else {
        callback(400, { 'error': 'Missing required field' })
    }

}
// Users -- put
// Required data is [phone]
handlers._users.put = function (data, callback) {
    // Check for required field
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    // Check for optional fields
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string'
        && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        // Error if nothing is send to update
        if (firstName || lastName || password) {

            // Get token from the headers
            const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
            handlers._tokens.verifyTokens(token, phone, function (tokenIsValid) {
                if (tokenIsValid) {
                    // Lockup the user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            // Update fields is necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (phone) {
                                userData.phone = phone;
                            }
                            if (password) {
                                userData.password = helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    debug(err);
                                    callback(500, { 'error': 'could\'not update user' });
                                }
                            });
                        } else {
                            callback(400, { 'error': 'the specified  user doesn\'t exist' });
                        }
                    });
                } else {
                    callback(403, { 'error': 'missing required token in header, or token is invalid' })
                }
            });
        } else {
            callback(400, { 'error': 'missing fields to update' });
        }
    } else {
        callback(400, { 'error': 'missing required field' });
    }
}

// Users -- delete
// Required data is [phone]
handlers._users.delete = function (data, callback) {
    // Check for required field [phone]
    const phone = typeof (data.queryString.phone) == 'string' && data.queryString.phone > 0 ? data.queryString.phone : false;

    if (phone) {
        // Get token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify if given token is valid with phone
        handlers._tokens.verifyTokens(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lockup the user
                _data.read('users', phone, function (err, userData) {
                   
                    if (!err) {
                        // Deleting user
                        _data.delete('users', phone, function (err) {
                            
                            if (!err) {
                                // Deleting of the checks user associated with the user
                                const userChecks = typeof (userData.checkes) == 'object' && userData.checkes instanceof Array ? userData.checkes : [];
                                const checkToDelete = userChecks.length;

                                if(checkToDelete > 0) {
                                    var checkToDeleted = 0;
                                    const deletingError = false;
                                    // Lockup through
                                    userChecks.forEach(function(checkId) {
                                        // Deleting the check
                                        _data.delete('checks', checkId, function(err) {
                                            if(err) {
                                                deletingError = true;
                                            }
                                            checkToDeleted ++;
                                            if(checkToDelete == checkToDeleted) {
                                                if(!deletingError) {
                                                    callback(200);
                                                }else {
                                                    callback(500, {'error' : 'Erros encountered while attempting to delete all of the user'});
                                                }
                                            }
                                        });
                                                                                
                                    });

                                }else {
                                    callback(200);
                                }
                                
                            } else {
                                callback(500, { 'error': 'could not delete user' });
                            }
                        });
                    } else {
                        callback(400, { 'error': 'user doesn\'t exist' });
                    }
                });
            } else {
                callback(403, { 'error': 'missing required token in header, or token is invalid' })
            }
        });
    } else {
        callback(400, { 'error': 'missing required' });
    }
}

// Tokens handlers
handlers.tokens = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(405);
    }
}

// Container for the all tokens methods
handlers._tokens = {};

// Method - post
// Required data: phone and password
// Optional data: none
handlers._tokens.post = function (data, callback) {
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim() > 0 ? data.payload.phone : false;
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim() > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
                // Hash the password, and compare with password in database
                const hashPassword = helpers.hash(password);
                if (hashPassword == userData.password) {
                    // If valid, create a new token with a randon name. Set expiration date one hour in the future
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone': phone,
                        'tokenId': tokenId,
                        'expires': expires
                    }

                    // Store data 
                    _data.create('tokens', tokenId, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { 'error': ' could not create the new token' });
                        }
                    });
                } else {
                    callback(400, { 'error': ' Password is not math the especified user' });
                }
            } else {
                callback(500, { 'error': ' could not find the especified user' });
            }
        });
    } else {
        callback(400, { 'error': 'missing required field(s)' })
    }
}


// Method - get
handlers._tokens.get = function (data, callback) {
    const token = typeof (data.queryString.id) == 'string' && data.queryString.id ? data.queryString.id : false;
    if (token) {
        // Read token
        _data.read('tokens', token, function (err, dataToken) {
            if (!err && token) {
                if (dataToken.expires >= Date.now()) {
                    callback(400, { 'error': 'this token is expired' });
                } else {
                    callback(200, dataToken);
                }
            } else {
                callback(400, { 'error': 'this token doens\'t exist' });
            }
        });
    } else {
        callback(400, { 'erros': 'missing requied token' });
    }
}


// Method - put_
// Require data [phone,tokenId, password]
// Optonal data: none
// Extends token valid for more 1 hour
handlers._tokens.put = function (data, callback) {
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim() ? data.payload.phone.trim() : false;
    const tokenIdinput = typeof (data.payload.tokenId) == 'string' && data.payload.tokenId.trim() ? data.payload.tokenId.trim() : false;

    if (phone || tokenIdinput) {
        // Read token and data from database
        _data.read('tokens', tokenIdinput, function (err, dataToken) {
            if (!err && dataToken) {
                // If tokenId exists
                if (dataToken.tokenId == data.payload.tokenId) {
                    // If token validate time is valid
                    if (dataToken.expires < Date.now()) {
                        const tokenObject = {
                            'phone': phone,
                            'tokenId': tokenIdinput,
                            'expires': Date.now()
                        }
                        // Update token validate
                        _data.update('tokens', tokenIdinput, tokenObject, function (err) {
                            if (!err) {
                                callback(200, tokenObject);
                            } else {
                                callback(500, { 'error': 'could not extend the validate token' });
                            }
                        });
                    } else {
                        callback(400, { 'error': 'this token is expired' });
                    }
                } else {
                    callback(400, { 'error': 'this token is invalid' });
                }
            } else {
                callback(400, { 'error': 'missing the required fields' });
            }
        });
    } else {
        callback(400, { 'error': 'missing required field' });
    }
}
// Method - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
    const tokenId = typeof (data.queryString.id) == 'string' && data.queryString.id ? data.queryString.id : false;
    if (tokenId) {
        // Lookup  the token
        _data.read('tokens', tokenId, function (err, dataToken) {
            if (!err) {
                // Deleting token
                _data.delete('tokens', tokenId, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'error': 'could not delete the user token' })
                    }
                });
            } else {
                callback(400, { 'error': 'this token is invalid' })
            }
        });
    } else {
        callback(400, { 'error': 'missing required tokenId' })
    }
}
// Verify if a given token is currently valid for a given user
handlers._tokens.verifyTokens = function (id, phone, callback) {
    // Lockup the token
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};


// Tokens checkes
handlers.checks = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback)
    } else {
        callback(405);
    }
}
// Containers for all the checks methods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, methods, sucesscode, timeoutSeconds
// Optional data: none
handlers._checks.post = function (data, callback) {
    // Validate all the imputs
    const protocols = typeof (data.payload.protocols) == 'string' && ['http', 'https'].indexOf(data.payload.protocols) > -1 ? data.payload.protocols : false;
    const url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const sucessCodes = typeof (data.payload.sucessCodes) == 'object' && data.payload.sucessCodes instanceof Array && data.payload.sucessCodes.length > 0 ? data.payload.sucessCodes : false;
    const timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocols && url && method && sucessCodes && timeoutSeconds) {
        // Get the tokens from the header
        const token = typeof (data.headers.token) == 'string' && data.headers.token.length > 0 ? data.headers.token : false;
        // Lockup the user reading by the token
        _data.read('tokens', token, function (err, tokenData) {
            if (!err && tokenData) {
                const userPhone = tokenData.phone;
                // Lockup the user
                _data.read('users', userPhone, function (err, userData) {
                    if (!err && userData) {
                        const userChecks = typeof (userData.checkes) == 'object' && userData.checkes instanceof Array ? userData.checkes : [];
                        // Verify that user has less more than max-checks-per-user
                        if (userChecks.length < config.maxChecks) {
                            // Create a randon id for check
                            const checkId = helpers.createRandomString(20);
                            // Create the checks object and include the user's phone 
                            const checksObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocols': protocols,
                                'url': url,
                                'method': method,
                                'sucessCodes': sucessCodes,
                                'timeoutSeconds': timeoutSeconds
                            }

                            _data.create('checks', checkId, checksObject, function (err) {
                                if (!err) {

                                    // Add check id in the users object
                                    userData.checkes = userChecks;
                                    userData.checkes.push(checkId);
                                    // Save the new user data
                                    _data.update('users', userPhone, userData, function (err) {
                                        if (!err && userData) {
                                            callback(200, checksObject);
                                        } else {
                                            callback(500, { 'error': 'could not update the user with the new check' });
                                        }
                                    });

                                } else {
                                    callback(500, { 'error': 'could not create the new check' })
                                }
                            });
                        } else {
                            callback(400, { 'error': 'the user already has the maximun number of the checks (' + config.maxChecks + ')' });
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, { 'error': 'missing required input(s), or input are invalids' });
    }
}


// Checks - post
// Required data: id
// Optional data: none
handlers._checks.get = function (data, callback) {
    // Check if the id provider is valid
    const id = typeof (data.queryString.id) == 'string' && data.queryString.id.length > 0 ? data.queryString.id.trim() : false;
    if (id) {

        // Lockup the check
        _data.read('checks', id, function (err, checkData) {
            if (!err && checkData) {
                // Get token from the headers
                const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                // Verify if given token is validand belongs to the user who create checker
                handlers._tokens.verifyTokens(token, checkData.userPhone, function (tokenIsValid) {
                    if (tokenIsValid) {
                        // Return the check data
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { 'error': 'Missing required field' });
    }
};

// Checks - put
// Required data: id
// Optional data: protocol, url, methods, sucesscode, timeoutSeconds
handlers._checks.put = function (data, callback) {

    // Check for required field
    const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    // Check for optional fields
    const protocols = typeof (data.payload.protocols) == 'string' && ['http', 'https'].indexOf(data.payload.protocols) > -1 ? data.payload.protocols : false;
    const url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const sucessCodes = typeof (data.payload.sucessCodes) == 'object' && data.payload.sucessCodes instanceof Array && data.payload.sucessCodes.length > 0 ? data.payload.sucessCodes : false;
    const timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    // Check to make shure id is valid
    if (id) {
        // Check to make shure one or more optional fields
        if (protocols || url || method || sucessCodes || timeoutSeconds) {
            // Lockup the check
            _data.read('checks', id, function (err, checkData) {
                if (!err && checkData) {
                    // Get token from the headers
                    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                    handlers._tokens.verifyTokens(token, checkData.userPhone, function (tokenIsValid) {
                        if (tokenIsValid) {
                            // Update the check where necessary 
                            if (protocols) {
                                checkData.protocols = protocols;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (sucessCodes) {
                                checkData.sucessCodes = sucessCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }
                            // Store the new updates
                            _data.update('checks', id, checkData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { 'error': 'Could not update the check' })
                                }

                            });
                        } else {
                            callback(403);
                        }
                    });
                }
            });

        } else {
            callback(400, { 'error': 'Missing field for update' });

        }
    } else {
        callback(400, { 'error': 'Missing required field' });
    }
}

// Checks - delete
// Required data : id
// Optional data : none
handlers._checks.delete = function (data, callback) {
    // Check if id is valid
    const id = typeof (data.queryString.id) == 'string' && data.queryString.id.trim().length == 20 ? data.queryString.id : false;
    if (id) {
        // Lookup  the check
        _data.read('checks', id, function (err, checkData) {
            
            if (!err && checkData) {
                // Get token  that sent the request
                
                const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyTokens(token, checkData.userPhone, function (tokenIsValid) {
                    if (tokenIsValid) {
                       // Deleting check
                       _data.delete('checks', id, function (err) {

                            if (!err) {
                                // Lockup the user
                                _data.read('users', checkData.userPhone, function (err, userData) {
                                    if (!err) {
                                        const userChecks = typeof (userData.checkes) == 'object' && userData.checkes instanceof Array ? userData.checkes : [];

                                        // Remove the check the list of checks
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            // Re-save the user's data
                                            userData.checks = userChecks;
                                            _data.update('users', checkData.userPhone, userData, function (err) {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { 'error': 'could not update the user' });
                                                }
                                            });

                                        } else {
                                            allback(500, { "Error": "Could not find the check on the user's object, so could not remove it." });
                                        }
                                    } else {
                                        callback(500, { "Error": "Could not find the user who created the check, so could not remove the check from the list of checks on their user object." });
                                    }
                                });
                            } else {
                                callback(500, { "Error": "Could not delete the check data." })
                            }
                        });
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(400, { "Error": "The check ID specified could not be found" });
            }
        });
    } else {
        callback(400, { "Error": "Missing valid id" });
    }
};

// Ping handlers
handlers.ping = function (data, callback) {
    callback(200);
}

// Not found handlers
handlers.notFound = function (data, callback) {
    // Callback a http status code, and a payload object
    callback(404);
}

// Export module
module.exports = handlers;