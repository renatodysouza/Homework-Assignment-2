/*
*
* Library for storing and editing data
*
*/

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module to be exported
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data');


// Write data for a file
lib.create = function(dir, file, data, callback) {
    fs.open(lib.baseDir+'/'+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor) {
      if(!err && fileDescriptor) {
            // Convert data to string
            const stringData = JSON.stringify(data);
           
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if(!err) {
                  fs.close(fileDescriptor, function(err){
                      if(!err) {
                         callback(false);
                      }else {
                          callback('Error to closing new file');
                      }
                  });
                }else{
                    callback('Error writing to new file');
                }
            })
        }else {
            callback('Could create a new file, it may already exist');
        }
    });

}
// Read data from a file
lib.read = function(dir, file, callback){
    fs.readFile(lib.baseDir+'/'+dir+'/'+file+'.json','utf-8', function(err, data) {
        
        if(!err && data) {
           const parseData = helpers.parseJsonToObject(data)
           callback(false, parseData);
        }else {
            callback(err, data);
        } 
       
    });
};


// Update data from a file
lib.update = function(dir,file, data, callback) {
    fs.open(lib.baseDir+'/'+dir+'/'+file+'.json','r+', function(err, fileDescriptor) {
        if(!err  && fileDescriptor){
            const stringData = JSON.stringify(data);
            // Truncate the file
            fs.truncate(fileDescriptor, function(err) {
                if(!err){
                    // Write to the file and close
                    fs.writeFile(fileDescriptor, stringData, function(err){
                        if(!err){
                            fs.close(fileDescriptor, function(err) {
                                if(!err){
                                  callback(false);
                                }else{
                                    callback('Erro to closing the file');
                                }
                            })
                        }else{
                            callback('Error to writing existing file');
                        }
                    });
                }else{
                    callback('Error trucating file');
                }
            });
        }else{
            callback('Could not open file for updating, it may not exist yet');
        }
    });
};

lib.delete =  function(dir, file, callback) {
    fs.unlink(lib.baseDir+'/'+dir+'/'+file+'.json', function(err) {
        if(!err){
           callback(false);
        }else{
           callback('Error, Could not possible delete this file, it may not exist');
        }
    });
};

// List all the itens in directory
lib.list = function(dir, callback) {
    fs.readdir(lib.baseDir+'/'+dir+'/', function(err, data) {
        if(!err && data && data.length > 0) {
            const trimedFileNames = [];
            data.forEach(function(fileName) {
                trimedFileNames.push(fileName.replace('.json', ''));
            });
            callback(false, trimedFileNames);
        }else{
            callback(err, data);

        }
    })
}




// Export
module.exports = lib;