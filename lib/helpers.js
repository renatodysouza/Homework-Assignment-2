/*
*
* Helpers for various tasks
*
*/

// Dependencies

const crypt = require('crypto');
const config = require('./config');
const queryString = require('querystring');
const https = require('https');
const fs = require('fs');
const path = require('path');
const util = require('util');
const debug = util.debuglog('helpers');
const StringDecoder = require('string_decoder').StringDecoder;




// Base directory of the data folder
const baseDir = path.join(__dirname, '/../.data/');


// Container for all the helpers

var helpers = {};

// Create a SHA256 hash 

helpers.hash = function (str) {

    if (typeof (str) == 'string' && str.length > 0) {
        const hash = crypt.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }

}

// Parse a json string to object in all case, whithou trowning
helpers.parseJsonToObject = function (str) {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return {};
    }

}

// create a string of random alphanumeric characteres, of a given length
helpers.createRandomString = function (stringLength) {
    stringLength = typeof (stringLength) == 'number' && stringLength > 0 ? stringLength : false;
    if (stringLength) {
        // define the all caracteres possible
        const possibleChar = 'abcdefghijlkmnopqrstuwyz0123456789'
        // start the final string
        let str = '';
        for (i = 1; i <= stringLength; i++) {

            // randon characteres
            const randomChar = possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));

            // append characteres
            str += randomChar;
        }
        // return the final string
        return str;
    } else {
        return false;
    }
};

// Api's Externals   //////////

// Stripe api - payment Api
// https://stripe.com/docs

helpers.processPayment = function (token, orderTotal, callback) {
    const total = typeof (orderTotal) == 'number' && orderTotal.toString().length > 0 ? orderTotal : false;

    const tokenStripe = typeof (token) == 'string' && token.trim().length > 0 ? token.trim() : false;


    if (tokenStripe) {
        //building the payload to be sent to stripe api
        var payload = {
            description: 'Pizza Delivery',
            amount: total * 100,//converting to cents
            currency: 'usd',
            source: tokenStripe //@TODO to be changed
        }

        var stringPayload = queryString.stringify(payload);
        requestOptions = {
            'protocol': 'https:',
            'hostname': 'api.stripe.com',
            'path': '/v1/charges',
            'method': 'POST',
            'headers': {
                'Authorization': `Bearer sk_test_VHNDUZdWfkmkeWav9Lqfs0mk`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }

        //making a request
        const req = https.request(requestOptions, res => {
            const status = res.statusCode;
            if (status == 200 || status === 201) {
                debug('Stripe payment successful.');
                callback(200);
            } else {
                callback('Status code: ' + status);
            }


            res.on('data', data => {
                var parsedData = JSON.parse(data);
                if (parsedData.error) {
                    callback(parsedData.error)
                } else {
                }


            });

        });


        req.on('error', () => {
            debug('payment failed');
        });
        //attaching the  string payload
        req.write(stringPayload);
        //sending the request
        req.end();
    } else {
        callback('Order ID or token  missing or invalid');
    }

}

helpers.sendEmail = function (data, callback) {
    
    if (data) {
        // Payload
        const payload = {
            'from': config.mailGun.defaultEmail,
            'to': data.email,
            'subject': data.orderId,
            'text': data.body

        };

        var stringPayload = queryString.stringify(data);
       

        // Request options
        const requestOptions = {
            'protocol': 'https:',
            'hostname': 'api.mailgun.net',
            'path': `/v3/${config.mailGun.sandboxDomain}/messages`,
            'method': 'POST',
            'headers': {
                'Authorization': `Basic ${Buffer.from(`api:${config.mailGun.apiKey}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)

            }
        }
            //making a request
        var req = https.request(requestOptions, res => {
            var status = res.statusCode;
            if (status == 200) {
                callback(status);
                debug(status);
            } else {
                callback(status);
            }
        });
        req.on('data', (data) => {
            callback(data);
        });

        req.on('error', (e) => {
            console.log(e);
            debug('Email failed to send');
        });
        //attaching the  string payload
        req.write(stringPayload);
        //sending the request
        req.end();

    } else {
        callback('missing required fields');
    }



};


// Generate email templates
templatesEmail = function(data) {
   // @TODO  testinf only
    const respUser = `Order Number:${data.orderId}\nData order: ${data.creatDate}\n
     Product(s): Pizza ${data.product[0].productId}\n${data.product[0].description}\n${data.product[0].price+'€'}\n
     Product(s):Pizza  ${data.product[1].productId}\n${data.product[1].description}\n${data.product[1].price+'€'}\n

      ${data.product[1]}\nPrice Total is ${data.priceTotal+'€'}`;

    return respUser;
}



// Api's Externals final code /////////////////

// Sum array in order
helpers.sumTotal = function (arrayN) {

    const arrayNun = typeof (arrayN) == 'object' && arrayN instanceof Array ? arrayN : false;
    var res = 0;
    arrayN.forEach(function (arraNumb) {
        res += arraNumb;

        ;
    });
    return res;


}

// Generate and manager product ids
helpers.generateIdProduct = function (callback) {
    // Verify if id exist, if exist get the largest id number generated
    fs.readdir(baseDir+'menus', function (err, menuId) {

        if (!err && menuId.length > 0) {
            const lgNumb = menuId.sort().reverse();
            const newId = lgNumb[0].replace('.json', '');
            const splitNumber =  newId.split('')[3];
            const numberFinal = Number(splitNumber) + 1;
            callback('000'+numberFinal);


        } else {
            const initCountId = 1;
            callback('000'+initCountId);

        }

    });


};

// Export module
module.exports = helpers;