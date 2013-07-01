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
  , async = require('async')
  , _ = require('lodash');

var EventEmitter = require('events').EventEmitter;

var Device = require('../device');
var Warehouse = require('../../warehouse');
var Container = require('../../container');
var Supplier = require('../../supplier');

/*

  Quarry.io - Warehouse
  ---------------------

  
*/

module.exports = function(job){

  job.prepare = function(done){

    var stack = {};
    var warehouse = null;

    function addsupplier(config, added){

      var useroute = config.route;

      if(_.isString(useroute)){
        if(useroute.match(/^\w+:/)){
          var parts = useroute.split(':');
          useroute = {
            department:parts[0],
            route:parts[1]
          }
        }
        else{
          useroute = {
            department:'warehouse',
            route:useroute
          }
        }
      }
      else{
        useroute = config.route;
      }

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      eyes.inspect(useroute);
      if(useroute.route=='/'){
        config.id = useroute.department + '_root';
      }
      else{
        config.id = useroute.route.replace(/^\//, '').replace(/\//g, '.');  
      }

      var supplier = Supplier(config.module, config, {
        cache:job.get_cache(),
        servers:job.get_servers(),
        receptionfront:stack.receptionfront
      })

      stack.warehouse.mount(useroute, function(req, res, next){
        supplier(req, res, next);
      })

      added();
    }

    async.series([
      function(next){
        job.get_reception_back(function(error, warehouse){
          stack.warehouse = warehouse;
          next();
        })
      },

      function(next){
        job.get_reception_front(function(error, receptionfront){
          stack.receptionfront = receptionfront;
          next();
        })
      },

      function(next){
        
        var supplierconfigs = job.container.attr('suppliers') || {};
        async.forEachSeries(_.keys(supplierconfigs), function(supplierroute, nextsupplier){

          var supplierconfig = supplierconfigs[supplierroute];
          supplierconfig.route = supplierroute;

          addsupplier(supplierconfig, nextsupplier);

        }, next)
        
      }
      
    ], done)
    

  }

  return job;
}