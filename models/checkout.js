/* 
*
* Checkout order
* integrate payment whith  Stripe library
*/


// Dependencies
const _data = require('../lib/data');
const helpers = require('../lib/helpers');
const config = require('../lib/config');
const util = require('util');
const vToken = require('./token');


// Debud the module
const debug = util.debuglog('checksModel');

checkoutModel = {};

// Select method checkes
checkoutModel.checkout = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        checkoutModel._checkout[data.method](data, callback)
    } else {
        callback(405);
    }

};


// Containers for all the checks methods
checkoutModel._checkout = {};


// Checks - post
// Required data: number card, name, Cvs
// Optional data: none

checkoutModel._checkout.post = function (data, callback) {
    const tokenStripe = 'tok_visa';
    const token = typeof (data.headers.token) == 'string' && data.headers.token.length == 20 ? data.headers.token : false;
    if (token && tokenStripe) {
        // Catch data by token
        vToken._tokens.get(data, function (status, dataToken) {
            // If token is valid read user data
            if (status == 200 && dataToken) {
                _data.read('users', dataToken.phone, function (err, userData) {
                    if (!err) {
                        // Catch cart data
                        _data.read('carts', dataToken.phone+'_cart', function (err, cartData) {

                            if (cartData == 0) {
                                callback(500, '{Error: could nor find any cart avaliable}');
                            } else {
                                const date = new Date();
                                // Creating cart object
                                const cartObject = {
                                    'orderId': cartData.cartId,
                                    'userPhone': userData.phone,
                                    'email': userData.email,
                                    'product': cartData.products,
                                    'priceTotal': cartData.priceTotal+'€',
                                    'order delivered': false,
                                    'status': 'open',
                                    'creatDate': date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                                    'time': date.toLocaleTimeString()
                                };
                                 console.log('cheguei');
                                // Call api stripe for payment
                                helpers.processPayment(tokenStripe, cartData.priceTotal, function (status) {
                                    if (status == 200 || status == 201) {

                                        helpers.sendEmail(cartObject, function (send) {
                                            if (send == 200 || send == 201) {
                                                // Save payment order
                                                cartObject.status = 'closed';
                                                _data.create('checkouts', cartData.cartId.id, cartObject, function (err, dataCheckers) {
                                                    if (!err) {
                                                        callback(200);

                                                    } else {
                                                        callback(400, 'could not save the payment order');
                                                    }

                                                });

                                            }


                                        });

                                    }
                                });

                            }

                        });

                    } else {
                        callback(400, { 'Error': 'Could not rotate users' });
                    }

                });

            } else {
                callback(400, dataToken);
            }

        });

    } else {
        callback(400, { 'Error': 'Missing required token' });
    }

};


// Export module
module.exports = checkoutModel;

