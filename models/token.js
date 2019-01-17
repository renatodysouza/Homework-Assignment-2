/*
*
* Request tokenModel - Token
*
*
*/


// Dependencies
const _data = require('../lib/data');
const helpers = require('../lib/helpers');
const config = require('../lib/config');
const util = require('util');



// Containe users usersModel
tokenModel = {};

// Tokens tokenMode
tokenModel.tokens = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        tokenModel._tokens[data.method](data, callback)
    } else {
        callback(405);
    }
}

// Container for the all tokens methods
tokenModel._tokens = {};

// Method - post
// Required data: phone and password
// Optional data: none
tokenModel._tokens.post = function (data, callback) {
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
                    // Verify if there are  an other token created by user phone
                    _data.list('tokens', function (err, listToken) {

                        if (!err && listToken.length > 0) {

                            // Listing tokens
                            listToken.forEach(function (lToken) {
                                _data.read('tokens', lToken, function (err, dataTk) {
                                    if (!err) {
                                        if (dataTk.phone == phone) {
                                            // Deleting older token
                                            _data.delete('tokens', dataTk.tokenId, function (err) {
                                                if (!err) {
                                                    // Store data 
                                                    _data.create('tokens', tokenId, tokenObject, function (err) {
                                                        if (!err) {
                                                            callback(200, tokenObject);
                                                        } else {
                                                            callback(500, { 'error': ' could not create the new token' });
                                                        }
                                                    });
                                                } else {
                                                    callback(err);
                                                }
                                            });
                                        } else {
                                            // Store data 
                                            _data.create('tokens', tokenId, tokenObject, function (err) {
                                                if (!err) {
                                                    callback(200, tokenObject);
                                                } else {
                                                    callback(500, { 'error': ' could not create the new token' });
                                                }
                                            });

                                        }

                                    } else {
                                        callback(500, { 'error': ' could not reading tokens, or doesn\'t exist any token' });
                                    }
                                });
                            });
                        } else {
                            // Store data 
                            _data.create('tokens', tokenId, tokenObject, function (err) {
                                if (!err) {
                                    callback(200, tokenObject);
                                } else {
                                    callback(500, { 'error': ' could not create the new token' });
                                }
                            });
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
tokenModel._tokens.get = function (data, callback) {
    const token = typeof (data.headers.token) == 'string' && data.headers.token ? data.headers.token : false;
    if (token) {
        // Read token
        _data.read('tokens', token, function (err, dataToken) {
            if (!err && token) {
                if (dataToken.expires < Date.now()) {
                    callback(400, { 'error': 'this token is expired' });
                } else {
                    callback(200, dataToken);
                }
            } else {
                callback(400, { 'error': 'this token doens\'t exist' });
            }
        });
    } else {
        callback(400, { 'erros': 'missing required token' });
    }
}


// Method - put_
// Require data [phone,token]
// Optonal data: none
// Extends token valid for more 1 hour
tokenModel._tokens.put = function (data, callback) {
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    const tokenIdinput = typeof (data.payload.token) == 'string' && data.payload.token.trim().length > 0 ? data.payload.token.trim() : false;
    if (phone || tokenIdinput) {
        // Read token and data from database
        _data.read('tokens', tokenIdinput, function (err, dataToken) {
            if (!err && dataToken) {

                // If tokenId exists
                if (dataToken.tokenId == data.payload.token) {
                    // If token validate time is valid
                    if (dataToken.expires < Date.now()) {
                        const tokenObject = {
                            'phone': phone,
                            'tokenId': tokenIdinput,
                            'expires': Date.now() + 1000 * 60 * 60
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
// Required data: token
// Optional data: none
tokenModel._tokens.delete = function (data, callback) {
    const tokenId = typeof (data.queryString.id) == 'string' ? data.queryString.id : false;
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
tokenModel._tokens.verifyTokens = function (id, phone, callback) {
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

// Export module
module.exports = tokenModel;