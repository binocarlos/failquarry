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


var utils = require('../utils')
  , eyes = require('eyes')
  , _ = require('lodash');

var Warehouse = require('../warehouse');
var Supplier = require('../supplier');
var Device = require('../network/device');

/*

  Quarry.io - Provider
  --------------------

  One level up from suppliers

  A provider is a collection of suppliers - you can POST to a provider to
  create a new supplier
  
*/

module.exports = function(options, network){

  var warehouse = Warehouse();

  /*
  
    we keep an object of loaded suppliers

    this is like a keep alive connection
    
  */
  var suppliers = {};

  /*
  
    this builds up a new object of the module we are configured to provide

    we append the id from the path onto the 'id' property of the config
    
  */
  function ensuresupplier(id, callback){

    // do we have it already loaded
    if(suppliers[id]){
      callback(null, suppliers[id]);
      return;
    }

    if(!options.autocreate){
      throw new Error('autocreate is not enabled on this provider')
    }
    
    /*
  
      give it the appended id from the path
      provider_id = 'test'
      /provider/1234
      supplier_id = test.1234
      
     */
    var createoptions = _.extend({}, options.supplier, {
      
    })

    createoptions.id = (options.id || 'provider' + utils.littleid()) + '.' + id;

    var supplier = Supplier(createoptions.module, createoptions, network);
    suppliers[id] = supplier;
    callback(null, supplier);
  }

  warehouse.post(function(req, res, next){

    /*
    
      if we are beneath the root then 
      
    */
    if(req.url!='/'){
      next();
      return;
    }

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('POSTING TO PROVIDER');
    eyes.inspect(req.toJSON());
    process.exit();
  })

  warehouse.use(function(req, res, next){

    var provider_url = req.getHeader('x-quarry-url').split(req.url)[0];
    var supplier_url = req.url.replace(/^\//, '');
    var parts = supplier_url.split('/');
    var supplier_id = parts.shift();
    req.url = '/' + parts.join('/');

    var supplier_route = provider_url + '/' + supplier_id;

    req.setHeader('x-quarry-supplier', supplier_route);

    ensuresupplier(supplier_id, function(error, supplier){
      if(error || !supplier){
        res.error(error);
        return;
      }
      supplier(req, res, next);
    })
  })

  return warehouse;
}