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

// Send an SMS via Twilio
helpers.twilioSms = function (phone, msg, callback) {
    // Validate the parameters
    phone = typeof (phone) == 'string' && phone.trim().length > 5 ? phone.trim() : false;
    msg = typeof (msg) == 'string' && msg.trim().length <= 1600 ? msg.trim() : false;
    if (phone && msg) {
        // Configuring the request payload
        const payload = {
            'From': config.twilio.fromPhone,
            'To': '+1'+phone,
            'Body': msg
        }
        // Stringfy the payload
        const StringfyPayload = queryString.stringify(payload);
        // Config the request retails
        const requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
            'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(StringfyPayload)
            }

        };
        // Instantiate the request object
        const req = https.request(requestDetails, function (res) {
            // Grab the status and send request
            const status = res.statusCode;
            // Calback sucessfully
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('status return waṣ: ' + status);
            }
        });
        // Bind to erro event so it doesn't get throw
        req.on('error', function (e) {
            callback(e);
        });
        // add to payload
        req.write(StringfyPayload);
        // End the request
        req.end();

    } else {
        callback(400, { 'error': ' missing required fields, or invalid' });
    }


};

// Export module
module.exports = helpers;