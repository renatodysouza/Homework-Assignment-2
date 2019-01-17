/* 
*
*Request MenuModel - Menu
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
const menuModel = {};


// Math function with request method

menuModel.menus = function (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        menuModel._menus[data.method](data, callback)

    } else {
        callback(405);
    };

}


menuModel._menus = {};


// Menu -Method Post
// Require data: product, description, quantity, stock, price
// Autogenerate data: Id, dataCreation
// Optional data: none

// Check all required fields are filled out
menuModel._menus.post = function (data, callback) {
    const product = typeof (data.payload.product) == 'string' && data.payload.product.trim().length > 0 ? data.payload.product.trim() : false;
    const description = typeof (data.payload.description) == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : false;
    const quantity = typeof (data.payload.quantity) == 'number' ? data.payload.quantity : 0;
    const stock = typeof (data.payload.stock) == 'boolean' && data.payload.stock == true ? true : false;
    const price = typeof (data.payload.quantity) == 'number' ? data.payload.quantity : 0;
    const dataCreated = Date.now();

    // Verify if user is logout -(verify if token exist and is valid)
    vToken._tokens.get(data, function (status, dataToken) {
        if (status == '200' && dataToken) {

            if (product && description && quantity && stock && price) {
                // Container post menu script

                // Generating id
                helpers.generateIdProduct(function (idAuto) {
                    if (idAuto >= 0) {
                        id = idAuto;
                        // Verify if given token is valid with phone

                        // Verify if id exist
                        _data.read('menus', id, function (err) {
                            if (err) {
                                // creating object Menu
                                const menuObject = {
                                    'product': product,
                                    'description': description,
                                    'quantity': quantity,
                                    'stock': stock,
                                    'dataCreated': dataCreated,
                                    'id': id,
                                    'price': price
                                }
                                // Storing the menu
                                _data.create('menus', id, menuObject, function (err, data) {
                                    if (!err) {
                                        callback(200, data);

                                    } else {
                                        callback(500, { 'error': 'Could not create the new menu' });
                                    }
                                });

                            } else {
                                callback(500, { 'Error': 'product id already exist' })
                            }

                        });



                    } else {
                        console.log('Error for generating id automaticament');
                    }
                }); 

            } else {
                callback(400, { 'Error': 'Missing required fields' });
            }
        } else {
            callback(400, dataToken);
        }

    });




};


// Menu -Method get - one or list
// Require data: id
// Optional data: none

menuModel._menus.get = function (data, callback) {

    // Verify if user is logout -(verify if token exist and is valid)
    vToken._tokens.get(data, function (status, dataToken) {
        if (status == '200' && dataToken) {

            // Container get one script
            const id = typeof (Number(data.queryString.id)) == 'number' && data.queryString.id > 0 ? data.queryString.id : false;
            if (id) {
                _data.read('menus', id, function (err, dataM) {
                    if (!err) {
                        callback(200, dataM);
                    } else {
                        callback(500, { 'Error': 'could not find Menu with this id' });
                    }
                });


            } else {
                // Menu -Method get - list
                // Require data: none  // Container get-all script
                _data.list('menus', function (err, menusData) {
                    if (!err) {
                        const menuD = [];
                        menusData.forEach(function (dataMenu) {
                            _data.read('menus', dataMenu, function (err, dataM) {
                                menuD.push(dataM);
                            });
                        });
                        setTimeout(function () {
                            callback(200, menuD);
                        }, 100);


                    } else {
                        callback(err);
                    }
                });


            }

        } else {
            callback(400, { 'Error': 'Missing required token, or token is invalid' });
        }

    });


}

// Menu -Method put
// Require data: product, description, quantity, stock
// Optional data: none
menuModel._menus.put = function (data, callback) {

    // Verify if user is logout -(verify if token exist and is valid)
    vToken._tokens.get(data, function (status, dataToken) {
        if (status == '200' && dataToken) {
            // Container put script

            const id = typeof (Number(data.queryString.id)) == 'number' && data.queryString.id > 0 ? data.queryString.id : false;
            const product = typeof (data.payload.product) == 'string' && data.payload.product.trim().length > 0 ? data.payload.product.trim() : false;
            const description = typeof (data.payload.description) == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : false;
            const quantity = typeof (data.payload.quantity) == 'number' ? data.payload.quantity : 0;
            const price = typeof (data.payload.quantity) == 'number' ? data.payload.quantity : 0;
            const stock = typeof (data.payload.stock) == 'boolean' && data.payload.stock == true ? true : false;
            const dataCreated = Date.now();
            if (id && product && description && quantity && price && stock) {
                // Create menu object
                const menuObject = {
                    'product': product,
                    'description': description,
                    'quantity': quantity,
                    'stock': stock,
                    'price': price,
                    'dataCreated': dataCreated,
                    'id': id,

                }
                
                
              
                // deleting menus
                _data.update('menus', id, menuObject, function (err) {
                    if (!err) {
                        callback(200, menuObject);
                    } else {
                        callback(500, { 'Error': 'could not delet the menu' });
                    }

                });
            } else {
                callback(400, { 'error': 'missing id, or invalid' });
            }
        } else {
            callback(400, { 'Error': 'Missing required token, or token is invalid' });
        }

    });

}

// Menu -Method Delete
// Require data: id
// Optional data: none
menuModel._menus.delete = function (data, callback) {

    // Verify if user is logout -(verify if token exist and is valid)
    vToken._tokens.get(data, function (status, dataToken) {
        if (status == '200' && dataToken) {

            // Container put script

            const id = typeof (Number(data.queryString.id)) == 'number' && data.queryString.id > 0 ? data.queryString.id : false;

            if (id) {
                _data.delete('menus', id, function (err) {
                    callback(200);
                });
            } else {
                callback(400, { 'error': 'missing id, or invalid' });
            }

        } else {
            callback(400, { 'Error': 'Missing required token, or token is invalid' });
        }

    });

}

// Export module 
module.exports = menuModel;