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

// Models
const userModel = require('../models/user');
const tokenMode = require('../models/token');
const menuModel = require('../models/menu');
const cartModel = require('../models/cart');
const orderModel = require('../models/order');
const checkoutModel = require('../models/checkout');


// Container handlers
// Define the handlers
const handlers = {};

// Model users
handlers.users = userModel.users;

// Model Token
handlers.tokens = tokenMode.tokens;

// Model Cart
handlers.cart = cartModel.carts;


// Model Menus
handlers.menus = menuModel.menus;

// Model Orders
handlers.order = orderModel.order;

// Model Checkout
handlers.checkout = checkoutModel.checkout;

// Ping handler
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