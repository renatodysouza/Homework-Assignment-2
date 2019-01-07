/* 
*
*  Works-related tasks
*
*/

// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');
const util =  require('util');

// Debuging module

const debug = util.debuglog('works')
// Instantiate workers object
const workers = {};

// Lockup to the checkers, get their data, send to a validator
workers.gatherAllChecks = function () {
    // Get all the checkers
    _data.list('checks', function (err, data) {
        if (!err && data && data.length > 0) {
            data.forEach(function (check) {
                // Read in the checker data 
                _data.read('checks', check, function (err, dataCheck) {

                    if (!err && dataCheck) {
                        // Pass it to the check validator, and let the function continue or log error as needed
                        workers.validateChecksData(dataCheck);

                    } else {
                        debug('Error reading one of the checks data');
                    }
                });
            });
        } else {
            debug('Could not find any checkers to process');
        }
    });

}

// Sanity check the check data
workers.validateChecksData = function (dataCheck) {
    dataCheck = typeof (dataCheck) == 'object' && dataCheck !== null ? dataCheck : {};
    dataCheck.id = typeof (dataCheck.id) == 'string' && dataCheck.id.trim().length == 20 ? dataCheck.id.trim() : false;
    dataCheck.userPhone = typeof (dataCheck.userPhone) == 'string' && dataCheck.userPhone.trim().length > 0 ? dataCheck.userPhone.trim() : false;
    dataCheck.protocol = typeof (dataCheck.protocols) == 'string' && ['http', 'https'].indexOf(dataCheck.protocols) > -1 ? dataCheck.protocols : false;
    dataCheck.url = typeof (dataCheck.url) == 'string' && dataCheck.url.trim().length > 0 ? dataCheck.url : false;
    dataCheck.method = typeof (dataCheck.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(dataCheck.method) > -1 ? dataCheck.method : false;
    dataCheck.sucessCodes = typeof (dataCheck.sucessCodes) == 'object' && dataCheck.sucessCodes instanceof Array && dataCheck.sucessCodes.length > 0 ? dataCheck.sucessCodes : false;
    dataCheck.timeoutSeconds = typeof (dataCheck.timeoutSeconds) == 'number' && dataCheck.timeoutSeconds % 1 === 0 && dataCheck.timeoutSeconds >= 1 && dataCheck.timeoutSeconds <= 5 ? dataCheck.timeoutSeconds : false;

    // Set the keys that may not be set (if the works have seen this check before)
    dataCheck.state = typeof (dataCheck.state) == 'string' && ['up', 'down'].indexOf(dataCheck.state) > -1 ? dataCheck.state : 'down';
    dataCheck.lastChecked = typeof (dataCheck.lastChecked) == 'number' && dataCheck.lastChecked > 0 ? dataCheck.lastChecked : false;

    // If all the checks pass, pass the data along to the next step in the process
    if (dataCheck.id &&
        dataCheck.userPhone &&
        dataCheck.protocol &&
        dataCheck.url &&
        dataCheck.method &&
        dataCheck.sucessCodes &&
        dataCheck.timeoutSeconds) {
        workers.performeChecks(dataCheck)

    } else {
        debug('Error: one of the checks is not properly formatted. Skipping it');
    }

};

// Perform the check, send the original check data and the outcome of the check process
workers.performeChecks = function (dataCheck) {

    // Prepare the initial check outcome
    const checkOutcome = {
        'error': false,
        'responseCode': false,
    };
    // Mark that the outcome not send yet
    var outcomeSent = false;
    // Parse the hostname and the path out of the check data
    const parseUrl = url.parse(dataCheck.protocols + '://' + dataCheck.url, true);
    const hostname = parseUrl.hostname;
    const path = parseUrl.path; // Using path and not pathname because we want the query string

    // Constructing the request
    const requestDetails = {
        'protocol': dataCheck.protocol + ':',
        'hostname': hostname,
        'method': dataCheck.method.toUpperCase(),
        'path': path,
        'timeout': dataCheck.timeoutSeconds * 1000,

    }
    // Instantiate the request object (using http or https module)
    const _moduleToUse = dataCheck.protocols === 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails, function (res) {
        // Grab the status the sent request
        const status = res.statusCode;

        // Update the check update and pass the data along
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            workers.processCheckOutcome(dataCheck, checkOutcome);
            outcomeSent = true;

        }


    });
    // Bind to the error event so it doesn't get throwing
    req.on('error', function (err) {
        // Update the check update and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': err
        }
        if (!outcomeSent) {
            workers.procesCheckOutcome(dataCheck, checkOutcome);
            outcomeSent = true;
        }

    });

    // Bind to the timeout event
    req.on('timeout', function (err) {
        // Update the check update and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        }
        if (!outcomeSet) {
            workers.procesCheckOutcome(dataCheck, checkOutcome);
            outcomeSent = true;
        }

    });
    // End the request
    req.end();

}

// Process the checks outcome , and update the check data
// Special logic to accomodating a check that has never been tested before 
workers.processCheckOutcome = function (dataCheck, checkOutcome) {

    // Decide if check is considered up or down 
    const state = !checkOutcome.error && checkOutcome.responseCode && dataCheck.sucessCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
    // Decide if an alert is warranted

    const alertWarranted = dataCheck.lastChecked && dataCheck.state !== state ? true : false;

    // Log the outcome
    const timeOfCheck = Date.now();
    workers.log(dataCheck, checkOutcome, state, alertWarranted, timeOfCheck);

    // Update the check data
    const newCheckData = dataCheck;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;


    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, function (err) {
        if (!err) {
            // Send the new check data to the next phase the process if need
            if (alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);

            } else {
                debug('Check outcome has not changed, no alert need');
            }


        } else {
            debug('Error: try to save updates to one of the checks');
        }

    });

};

// Alert the user as to be change in their check status
workers.alertUserToStatusChange = function (newCheckData) {
    const msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocols + '://' + newCheckData.url + ' is currently ' + newCheckData.state;
    helpers.twilioSms(newCheckData.userPhone, msg, function (err) {
        if (!err) {
            debug('sucess: user was alerted t status change in their checks, via sms');
        } else {
            debug('Error: could not send sms alert to user');
        }

    });
};

// log create
workers.log = function (dataCheck, checkOutcome, state, alertWarranted, timeOfCheck) {
    // Form the log data
    const logData = {
        'check': dataCheck,
        'outcome': checkOutcome,
        'state': state,
        'alert': alertWarranted,
        'timeOfCheck': timeOfCheck
    }
    // Convert data to string
    const logString = JSON.stringify(logData);
    // Determine the namme of the log file
    logFileName = dataCheck.id;

    // Append to log string to the file
    _logs.append(logFileName, logString, function(err) {
        debug(err);
        if(!err){
        debug('Logging to file succeeded');
        } else {
        debug('Logging to file failed');
        }

    });

};


// Timer to execute process once per minute
workers.loop = function () {
    setInterval(function () {
        workers.gatherAllChecks();

    }, 1000 * 60);

};

// Rotate (compress) the log files
workers.rotateLogs = function() {
    // list the all non compress log files
    
    _logs.list(false, function(err, logs) {
        if(!err && logs.length > 0){
           logs.forEach(function(logName){
               // Compress the data to a different file
                  const logId = logName.replace('.log', '');
                  const newFileId = logId+'-'+Date.now();
                  _logs.compress(logId, newFileId, function(err) {
                      if(!err){
                          // Truncate  the file
                          _logs.truncate (logId, function(err){
                              if(!err){
                                 debug('Sucess: file truncated');
                              } else {
                                 debug('Error: Could not truncate the log file');
                              }
                          });
                        debug('sucesss:  compressed log files');
                      } else {
                         debug('Error: could not compressing the logs');
                      }
                  });
            });
        } else {
            debug('Error: could not find any logs to rotate');
        }
    });
}

// Timer to execute log-rotation process once-per-day
workers.logRotationLoop = function() {
    setInterval(function () {
        workers.rotateLogs();

    }, 1000 * 60 * 60 * 24);

};

//  Init script
workers.init = function () {
    // Executing all the checks inmediately
    workers.gatherAllChecks();


    // Call the loop so the checks will execute later on
    workers.loop();
};

// Compress all the logs immediately
workers.rotateLogs();

// Call the compression loop so logs will be compress later on
workers.logRotationLoop();




// Export module
module.exports = workers;

