/*
*
* Request usersModel - Users
*
*
*/


// Dependencies
const _data = require('../lib/data');
const helpers = require('../lib/helpers');
const path = require('path');
const util = require('util');
const vToken = require('./token');
const debug = util.debuglog('user');


// Container users usersModel
const usersModel = {};

// Users
usersModel.users = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        usersModel._users[data.method](data, callback)

    } else {
        callback(405);
    };

}

usersModel._users = {};

// Users Method post
// Required data: firstname, lastname,street address,  phone, email, password,  tosAgreement
// Optional data: none

usersModel._users.post = function (data, callback) {

    // Check all required fields are filled out
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string'
        && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const streetAdress = typeof (data.payload.streetAdress) == 'string' && data.payload.streetAdress.trim().length > 7 ? data.payload.streetAdress.trim() : false;
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 5 ? data.payload.phone.trim() : false;
    const email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 5 ? data.payload.email.trim() : false;
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == 'true' ? true : true;

    if (firstName && lastName && streetAdress && phone && email && password && tosAgreement) {
        const pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
        const emailRegex = pattern.test(email);
        // Passed if email is correct
        if (emailRegex) {
            // Make shure that user doesnt already exists

            _data.read('users', phone, function (err, data) {
                if (err) {
                    // Verify ifemail exist
                    _data.emailExist(email, function (exists) {
                        if (exists) {
                            callback(500, { 'error': 'email already exist' });
                        } else {
                            // Hash the password
                            const hashPassword = helpers.hash(password);
                            // Create the user object
                            if (hashPassword) {
                                const userObject = {
                                    'firstName': firstName,
                                    'lastName': lastName,
                                    'streetAdress': streetAdress,
                                    'phone': phone,
                                    'email': email,
                                    'password': hashPassword,
                                    'tosAgreement': true
                                };
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


                        }
                    });

                } else {
                    // If phone user already exist
                    callback(400, { 'error': 'User already exists' });
                }
            });


        } else {
            callback(400, { 'error': 'Email format invalid' });
        }

    } else {
        callback(400, { 'error': 'Missing required fields' });
    }
};

// Users -- get
// Required field [phone]
// Optional data none

usersModel._users.get = function (data, callback) {
    // Check if the phone provider is valid
    const phone = typeof (data.queryString.phone) == 'string' && data.queryString.phone.trim() > 0 ? data.queryString.phone.trim() : false;
    if (phone) {

        // Get token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        
        // Verify if given token is valid with phone

        vToken._tokens.verifyTokens(token, phone, function (tokenIsValid) {
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
usersModel._users.put = function (data, callback) {
    // Check for required field
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    // Check for optional fields
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string'
        && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof (data.payload.password) == 'string'   
        && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 5 ? data.payload.email.trim() : false;
    const streetAdress = typeof (data.payload.streetAdress) == 'string' && data.payload.streetAdress.trim().length > 7 ? data.payload.streetAdress.trim() : false;


    if (phone) {
        // Verify if email is formated correctly
        const pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
        const emailRegex = pattern.test(email) ? email : false;

        // Error if nothing is send to update
        if (firstName || lastName || password || emailRegex || streetAdress) {

            // Get token from the headers
            const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
            vToken._tokens.verifyTokens(token, phone, function (tokenIsValid) {
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
                            if (streetAdress) {
                                userData.streetAdress = streetAdress;
                            }
                            // Store the new updates
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200, userData);
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
usersModel._users.delete = function (data, callback) {
    
    // Check for required field [phone]
    const phone = typeof (data.queryString.phone) == 'string' && data.queryString.phone > 0 ? data.queryString.phone : false;

    if (phone) {
        // Get token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
      
        // Verify if given token is valid with phone
        vToken._tokens.verifyTokens(token, phone, function (tokenIsValid) {
            
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

                                if (checkToDelete > 0) {
                                    var checkToDeleted = 0;
                                    const deletingError = false;
                                    // Lockup through
                                    userChecks.forEach(function (checkId) {
                                        // Deleting the check
                                        _data.delete('checks', checkId, function (err) {
                                            if (err) {
                                                deletingError = true;
                                            }
                                            checkToDeleted++;
                                            if (checkToDelete == checkToDeleted) {
                                                if (!deletingError) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { 'error': 'Erros encountered while attempting to delete all of the user' });
                                                }
                                            }
                                        });

                                    }); 

                                } else {
                                    callback(200);
                                }

                                // Deleting of the token associated with the user
                                _data.listAndDelet(token, function(err) {
                                    if(err) {
                                        debug('error: Could not deleting token');
                                    }
                               });
                               

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


// Export module
module.exports = usersModel;