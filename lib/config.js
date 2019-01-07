/*
*  
* variables configuring production, and developer mode
*
*/


// container for all environments

const environments = {};


// Default environments (staging)
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envname': 'staging',
    'hashingSecret' : 'thisIsaSecret',
    'maxChecks': 5,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
      }

};

// Production environments
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envname': 'production',
    'hashingSecret' : 'thisIsaSecret',
    'maxChecks': 5,
    'twilio' : {
        'accountsId': '',
        'authToken': '',
        'fromPhone': ''
    }


}

// Current environmet
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check current environment is one above, if not, set default environment

const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;


// export 
module.exports = environmentToExport;