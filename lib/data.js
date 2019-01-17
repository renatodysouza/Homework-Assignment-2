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


// Read data from a file
lib.readCart = function(dir,id, callback){
    // Read all cart and catch name's cart
    fs.readdir(lib.baseDir+'/'+dir+'/', function(err, data) {
        
        if(!err && data){
             const nameC =  []
            // iterate name's cart
            data.forEach(function(nameCart) {
                // Reading files cart
               
                // Compare id and name's cart
                if(nameCart.split('_')[0] == id) {
                    fs.readFile(lib.baseDir+'/'+dir+'/'+nameCart,'utf-8', function(err, data) {
        
                        if(!err && data) {
                           const parseData = helpers.parseJsonToObject(data)
                           nameC.push(parseData);
                        }else {
                           
                        } 
                                        
                    });
                   
                }else {
                    callback(err);
                }
             
            });   
                
           setTimeout(function(){
                    callback(nameC);

                }, 200);
        } else {
           callback(400,{'Error': 'could not read cart list'})
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
                                    callback('Error to closing the file');
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
  
  // Unlink the file from the filesystem
  fs.unlink(lib.baseDir+'/'+dir+'/'+file+'.json', function(err){
    callback(err);
  });

}

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
};



// Verify if user phone exist 


// Verify if email already existed
lib.emailExist = function(email, callback) {
       // Open user list
    fs.readdir(lib.baseDir+'/users', function(err, userData) {
           if(!err){
       
        if(userData.length > 0) {
            userData.forEach(function(data) {
                fs.readFile(lib.baseDir+'/users/'+data, 'utf8',function(err, dataUser) {
                    if(!err){
                        const dataUserParse = typeof(dataUser) == 'string' && dataUser.trim().length > 0 ? JSON.parse(dataUser) : false;
                        const exist = dataUserParse.email == email ? true : false;
                        callback(exist);
                    } else {
                      callback(false);
                    }
                });
            });

        }else {
            callback(false);
        }
    
         
            
        } else {
           callback('Error, directory not found. or doesnt exists users');
        }

    });
}


// List tokens and delete token when user was deleted

lib.listAndDelet = function(token, callback) {
    
    // List tokens
    fs.readdir(lib.baseDir+'/tokens/', function(err, tokens) {
        if(!err && tokens.length > 0){
           tokens.forEach(function(oneToken) {
               const tokenLink = typeof(oneToken) =='string' && oneToken ==  token+'.json' ? oneToken : false;
               // Deleting token relationship with user specified
               if(tokenLink) {
                fs.unlink(lib.baseDir+'/tokens/'+tokenLink, function(err) {
                    callback(err)
                });

               }
               
            });     
          
        } else {
           callback(err)
        }

    });

};
 

// Export
module.exports = lib;