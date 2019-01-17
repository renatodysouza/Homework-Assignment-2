/* 
*
*Request OrderModel
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


// Base directory of the data folder
const baseDir = path.join(__dirname, '/../.data');


// container menu models
const orderModel = {};


// Math function with request method

orderModel.order = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        orderModel._order[data.method](data, callback)

    } else {
        callback(405);
    };

}


orderModel._order = {};


// Order - Method Post
// Require data: none (by token)
// Optional data: none

orderModel._order.post = function (data, callback) {

    // Verify if user is logout -(verify if token exist and is valid)
    vToken._tokens.get(data, function (status, dataToken) {
        if (status == '200' && dataToken) {

            // Container call post 
            // Catch phone of the token data
            _data.read('tokens', data.headers.token, function (err, tokenData) {

                if (!err) {
                    const phone = tokenData.phone;

                    // Verify if user has an other order open
                    _data.list('orders', function (err, orderData) {
                        if (!err) {
                            if (orderData.length > 0) {

                                orderData.forEach(function (order) {
                                    _data.read('orders', order, function (err, order) {
                                        if (order.customer == phone) {
                                            callback(500, { 'Error': 'User has order open already' });
                                        }

                                    });
                                });

                            } else {

                                // Catch users data
                                _data.read('users', phone, function (err, userData) {
                                    // List Carts
                                    _data.list('carts', function (err, catsData) {
                                        const productArray = [];
                                        const priceTotalArray = [];
                                        var count = 0;
                                        var limit = catsData.length;

                                        catsData.forEach(function (cat) {

                                            _data.read('carts', cat, function (err, carts) {
                                                if (!err) {
                                                    if (phone == carts.userPhone) {
                                                        delete carts['userPhone'];
                                                        productArray.push(carts);
                                                        priceTotalArray.push(carts.price);
                                                        count++;
                                                    }
                                                    if (count == limit) {
                                                        
                                                        // Create new order object
                                                        const idOrder = helpers.createRandomString(6);
                                                        const date = new Date();
                                                        const orderObject = {
                                                            "id": idOrder,
                                                            "customer": phone,
                                                            "email": userData.email,
                                                            "products": productArray,
                                                            "total": helpers.sumTotal(priceTotalArray),
                                                            "creaDateOrder": date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                                                            "time": date.toLocaleTimeString(),
                                                            "status": 'open'
                                                        }

                                                        // Save order object
                                                        _data.create('orders', idOrder, orderObject, function (err, data) {
                                                            if (!err) {
                                                                callback(200, orderObject);

                                                            } else {
                                                                callback(200, { 'Error': 'could not save order' });
                                                            }

                                                        });

                                                    }

                                                } else {

                                                }
                                            });
                                        });







                                    });


                                });
                            }
                        } else {
                            callback(500, { 'Error': 'could not listing orders' });
                        }
                    });
                } else {

                }
            });

        } else {
            callback(400, dataToken);
        }
    });


};


// Order - Method Get
// Require data: phone
// Optional data: none
orderModel._order.get = function (data, callback) {

    const phone = typeof (data.queryString.phone) == 'string' && data.queryString.phone.trim().length > 5 ? data.queryString.phone : false;


    // Verify if user is logout -(verify if token exist and is valid)
    vToken._tokens.get(data, function (status, dataToken) {
        if (status == '200' && dataToken) {
            // Rotating orders
            _data.list('orders', function (err, ordersData) {
                // Readding data of the orders
                var ordersArray = [];
                ordersData.forEach(function (order) {
                    _data.read('orders', order, function (err, dataOrder) {
                        if (!err && dataOrder) {

                            if (dataOrder.customer == phone && dataOrder.status == 'open') {
                                callback(200, dataOrder);
                            }


                        } else {
                            callback(400, 'could not reading order');
                        }

                    });


                });

            });


        } else {
            callback(400, dataToken);
        }
    });

}



// Order - Method Delete
// Require data: order Id
// Optional data: none

orderModel._order.delete = function (data, callback) {
    const orderId = typeof (data.queryString.id) == 'string' && data.queryString.id.length > 0 ? data.queryString.id : false;
    // Verify if user is logout -(verify if token exist and is valid)
    vToken._tokens.get(data, function (status, dataToken) {
        if (status == '200' && dataToken) {

            _data.delete('orders', orderId + '_order', function (err, data) {
                if (!err) {
                    callback(200, data);
                } else {
                    callback(500, { 'Error': 'The order Id is wrong, or invalid' });
                }

            });
        } else {
            callback(400, dataToken);
        }
    });

}

// export module
module.exports = orderModel;
