/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/**
 * Module dependencies.
 */

var utils = require('../../utils')
  , eyes = require('eyes')
  , _ = require('lodash')
  , mongo = require('../../vendor/mongo');

var ensure_skeleton = require('./ensure_skeleton');

/*

  the basic container supplier that maps REST onto our api
  
*/
var ContainerSupplier = require('../container');

/*

  Quarry.io - QuarryDB
  --------------------

  MongoDB based supplier optimized for big trees
  
*/

var handlers = {
  select:require('./select'),
  append:require('./append'),
  save:require('./save'),
  delete:require('./delete')
}

module.exports = function(options, network){

  options || (options = {});
  network || (network = {});

  /*
  
    in provider land our collection is filled in from the path
    
  */
  options.collection = options.collection ? options.collection : options.id;
  _.defaults(options, (network.servers ? network.servers.mongo : {
    hostname:"127.0.0.1",
    port:27017
  }))

  if(!options.collection){
    throw new Error('quarrydb supplier needs a collection option');
  }

  options.collection = options.collection.replace(/[^\w\.]/g, '');

  /*
  
    construct the basic container supplier

    this setups the request processing middleware
    specifically for container suppliers
    
  */
  var supplier = ContainerSupplier(options);

  supplier.prepare(function(finished){

    var server_options = options;

    mongo(server_options, function(error, mongoclient){

      /*
      
        when we are ready preparing we setup the supplier
        hooked into this mongoclient
        
      */
      function client_ready(){

        if(!error){


 
          /*
          
            provide each of the method handlers

            the container supplier will map these for stamping portals etc
            
          */

          supplier.stampwrapper({
            type:'quarry/containers'
          })
          supplier.portalwrapper();
          supplier.selectwrapper(handlers.select(mongoclient));
          supplier.appendwrapper(handlers.append(mongoclient));
          supplier.savewrapper(handlers.save(mongoclient));
          supplier.deletewrapper(handlers.delete(mongoclient));

        }

        finished();
      }

      if(server_options.reset){
        mongoclient.drop(client_ready);
      }
      else{
        client_ready();
      }

    })

  })

  return supplier;
}
