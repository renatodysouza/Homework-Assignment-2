/* 
*
*  Library for store and rotating logs
*
*
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Containe for the module
const lib = {};

// Base directory of the logs folder
lib.baseDir = path.join(__dirname, '/../logs/');

// Append a string to the file, create a file if it doens't exist 
lib.append = function (logFileName, logString, callback) {
    // Open the file for appending
   

}


// Compress the contents of one .log file into a .gz.b64 file withing the same directory


lib.compress= function(logId, newFileId, callback) {
    const sourceFile = logId+'.log';
    const destinationFile = newFileId+'.gz.b64';

    // Read the source file
    fs.readFile(lib.baseDir+sourceFile,'utf8', function(err, inputString) {
        if(!err && inputString ){
            // Compressing tha data using Gzip
            zlib.gzip(inputString, function(err, buffer) {
                if(!err && buffer){
                    // Send data to the destination file
                    fs.open(lib.baseDir+destinationFile, 'wx', function(err, fileDescriptor) {
                        if(!err && fileDescriptor){
                            // Write to the file destination
                            fs.writeFile(fileDescriptor,buffer.toString('base64'), function(err) {
                            if(!err){
                               // Close the destination file
                               fs.close(fileDescriptor, function(err) {
                                 if(!err){
                                   callback(false);
                                 } else {
                                    callback(err);
                                 }
                               
                               });
                            } else {
                               callback(err);
                            }
                            });
                        
                        } else {
                           callback(err);
                        }

                    });
                     
                } else {
                   callback(err);
                }
            });
        
        } else {
           callback('Error: could not read the log file')
        }
    })

};



// Decompress the contents of a .gz.b64
lib.decompress = function(fileId, callback) {
    const fileName = fileId+'.gz.b64';
    fs.readFile(lib.baseDir+fileName,'utf8', function(err, logs) {
        if(!err && logs){
            // Decompress the data
            const inputBuffer = Buffer.from(logs, 'base64');
            zlib.unzip(inputBuffer, function(err, outputBuffer) {
                if(!err && outputBuffer){
                   // Callback
                   const logs = outputBuffer.toString();
                   callback(logs);

                } else {
                   callback(err);
                }

            });
        
        } else {
           callback(err)
        }

    });
}

// Truncate a log file
lib.truncate = function(fileId, callback) {
    fs.truncate(lib.baseDir+fileId+'.log', '0',function(err) {
        if(!err){ 
            callback(false);        
        } else {
          callback(err)
        }
    })
}

// List all the logs and optionally include the compressed logs    

lib.list =  function(includeCompressLog, callback) {
   fs.readdir(lib.baseDir, function(err, data) {
       if(!err && data.length > 0){
          const trimmedNames = [];
          data.forEach(function(fileName){
              // Add the log files
              if(fileName.indexOf('.log') > -1) {
                     trimmedNames.push(fileName.replace('.log', ''));
              }
             // Add on the .gz file
             if(fileName.indexOf('.gz.b64') > -1) {
                 trimmedNames.push(fileName.replace('.gz.b64', ''));
             }
          });
          callback(false, trimmedNames);
       } else {
          callback(err, data)
       }
    });
}



// Instantiate module


// Export module
module.exports = lib;