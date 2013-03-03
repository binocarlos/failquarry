/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

var _ = require('underscore');
var async = require('async');
var utils = require('../utils');
var Backbone = require('../vendor/backbone');
var eyes = require('eyes');
var supplier_factory = require('../supplier/factory');

/*
  Quarry.io - Provider
  --------------------

  


 */



module.exports = function(options){

  return function(warehouse){

    /*
    
      the cache of already built suppliers
      
    */
    var cache = {};

    warehouse.use(function(req, res, next){
    
      ensure_supplier(req, res, function(error, supplier){

        if(error){
          res.sendError(error);
          return;
        }

        supplier.handle(req, res, next);

      })
    })

    function ensure_supplier(req, res, ready){
      var path = req.path().split('/')[1];
      req.matchroute('/' + path);

      if(cache[path]){
        ready(null, cache[path]);
        return;
      }

      create_supplier(path, req, function(error, supplier){
        if(error){
          res.sendError(error);
          return;
        }
        cache[path] = supplier;
        ready(null, supplier);
      })
    }

    function create_supplier(path, req, ready){

      var supplier_options = _.clone(options);

      /*
      
        the path that entered the stack for this supplier

          /ram/files/xml/cities/12344

          '/ram/files/xml/cities' = stamp

          ''
        
      */
      
      /*
      
        deployment is set inside of warehouse->inject_deployment_to_requests
        
      */
      supplier_options.path = path;
      supplier_options.deployment = req.deployment.toJSON();

      var supplier = supplier_factory(supplier_options, function(error){
        ready(error, supplier);
      })

      return supplier;
    }

  }

}