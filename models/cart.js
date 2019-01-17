/* 
*
*Request CartModel - Cart
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
const cartModel = {};


// Math function with request method

cartModel.carts = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        cartModel._carts[data.method](data, callback)

    } else {
        callback(405);
    };

}


cartModel._carts = {};


// Cart - Method Post
// Require data: menuId
// Optional data: none

cartModel._carts.post = function (data, callback) {
    // Check all required fields are filled out
    const menuId = typeof (data.payload.menuId) == 'object' && data.payload.menuId instanceof Array ? data.payload.menuId : [];

    if (menuId.length > 0) {

        // Verify if user is logout -(verify if token exist and is valid)
        vToken._tokens.get(data, function (status, dataToken) {
            if (status == '200' && dataToken) {

                // Verify if exist cart
                _data.list('carts', function (err, dataCart) {
                    if (!err) {
                        // if exist a cart append news products
                        if (dataCart.indexOf(dataToken.phone + '_cart') > -1) {
                            // Catch the cart
                            _data.read('carts', dataToken.phone + '_cart', function (err, dataCart) {
                                if (!err) {
                                    // Readding data of the menus
                                    var count = 0;
                                    var limit = menuId.length;
                                    var menuNew = [];
                                    var priceNew = [];
                                    menuId.forEach(function (menu) {
                                        _data.read('menus', menu, function (err, menuData) {
                                            // Catch menu data by new menu id
                                            menuNew.push(menuData);
                                            priceNew.push(menuData.price);
                                            count++;
                                            if (count == limit) {

                                                const priceN = dataCart.priceTotal;
                                                delete dataCart.priceTotal
                                                delete dataCart.userPhone;
                                                var counter2 = 0;
                                                var limit2 = dataCart.products.length;
                                                // Catch menu data by old cart of the user
                                                dataCart.products.forEach(function (oldCart) {
                                                    menuNew.push(oldCart);
                                                    counter2++;

                                                    if (counter2 == limit2) {
                                                        // Sum of total of the carts
                                                        const total = helpers.sumTotal(priceNew);

                                                        // Creating cart object
                                                        const date = new Date();
                                                        const cartObject = {
                                                            'userPhone': dataToken.phone,
                                                            'products': menuNew,
                                                            'priceTotal': total + priceN,
                                                            'order delivered': false,
                                                            'timeUpdadeOrder': date.toLocaleTimeString(),
                                                            'updateOrder': date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                                                        };
                                                        // Save the cart object
                                                        _data.update('carts', dataToken.phone + '_cart', cartObject, function (err) {
                                                            if (!err) {
                                                                callback(200, cartObject);
                                                            } else {
                                                                callback(500, { 'Error': 'could not save the cart, cart already exist. Use get or put methods' });
                                                            }
                                                        });

                                                    };

                                                });

                                            };

                                        });

                                    });

                                } else {
                                    callback('could not read any carts')
                                }
                            });

                        } else { // Creating new cart
                            // Catch menu data

                            var count = 0;
                            var limit = menuId.length;
                            var menuComplete = [];
                            var total = [];

                            menuId.forEach(function (menu) {
                                // Readding menu data

                                _data.read('menus', menu, function (err, menuData) {
                                    if (!err) {
                                        menuComplete.push(menuData);
                                        total.push(menuData.price);
                                        count++;
                                        if (count == limit) {
                                            // Creating cart object
                                            const date = new Date();
                                            const cartObject = {
                                                'CartId': dataToken.phone+'_cart',
                                                'userPhone': dataToken.phone,
                                                'products': menuComplete,
                                                'priceTotal': helpers.sumTotal(total),
                                                'order delivered': false,
                                                'timeUpdadeOrder': date.toLocaleTimeString(),
                                                'updateOrder': date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                                            };
                                            // Save the cart object
                                            _data.create('carts', dataToken.phone+'_cart', cartObject, function (err) {
                                                if (!err) {
                                                    callback(200, cartObject);
                                                } else {
                                                    console.log(err);
                                                    callback(500, { 'Error': 'could not save the cart, cart already exist. Use get or put methods' });
                                                }
                                            });
                                        }
                                    } else {
                                        callback(400, { 'Error': 'please, Verify if product id is valid' });
                                    }

                                })

                            });
                        }

                    } else {
                        callback('Could not list carts');
                    }

                });

            } else {
                callback(400, dataToken);
            }
        });
    } else {
        callback(500, { 'Error': 'Missing required id products fields' });
    }
}


// Cart - Method Get
// Require data: none
// Optional data: none

cartModel._carts.get = function (data, callback) {

    vToken._tokens.get(data, function (status, dataToken) {
        if (status == '200' && dataToken) {

            // find cart by id
            _data.read('carts', dataToken.phone + '_cart', function (err, dataCart) {
                if (!err) {
                    callback(200, dataCart);

                } else {
                    callback(400, { 'Error': 'could find any cart for this user' });

                }
            });

        } else {
            callback(400, dataToken);
        }

    });

};


// Cart - Method Delete All
// Require data: Cart id
// Optional data: none


cartModel._carts.delete = function (data, callback) {
    // Check all required fields are filled out
    const menuId = typeof (data.payload.menuId) == 'object' && data.payload.menuId instanceof Array ? data.payload.menuId : [];
    const productId = typeof (data.queryString.id) == 'string' && data.queryString.id.trim().length > 0 ? data.queryString.id : false;
    if (productId) {
        // Verify if user is logout -(verify if token exist and is valid)
        vToken._tokens.get(data, function (status, dataToken) {
            if (status == '200' && dataToken) {

                // Container delete script

                // Catch phone by token
                _data.read('tokens', data.headers.token, function (err, dataToken) {
                    if (!err) {
                        const phone = dataToken.phone;
                        // Listing all carts
                        _data.list('carts', function (err, cardsList) {
                            if (!err && cardsList.length > 0) {

                                cardsList.forEach(function (lCard) {
                                    if (phone == lCard.split('_')[0]) {
                                        // Deleting carts
                                        _data.delete('carts', lCard, function (err) {
                                            if (!err) {
                                                callback(200);
                                            } else {
                                                callback(err);
                                            }

                                        });
                                    }
                                });
                            } else {
                                callback(400, { 'Error': 'Could not listing carts, or any carts exist' });
                            }
                        });
                    } else {
                        callback(400, { 'Error': 'Could not reading tokens' });
                    }
                });

            } else {
                callback(400, dataToken);
            }
        });
    } else {

        
        // Deleting products by menu id
        if(menuId && menuId.length > 0) {
            menuId.forEach(function(menu) {
                _data.delete('carts', menu, function(err) {
                    if(!err){
                       callback('Could not delete the cart or carts indicated');
                    } 

                });

            });
        }
        
    }
}


// export module

module.exports = cartModel;
