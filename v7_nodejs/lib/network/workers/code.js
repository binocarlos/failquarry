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
var ThreadServer = require('../../threadserver/server');
/*

  Quarry.io - Code
  ----------------

  

  
  
*/

module.exports = function(job){

  job.prepare = function(done){
    var stack = {};

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
        
        var server = new ThreadServer({
          supplychain:stack.receptionfront,
          codefolder:job.hq.attr('stack.corefolder')
        })

        var codewarehouse = Warehouse();

        codewarehouse.post(function(req, res, next){
          server.map({
            project:req.getHeader('x-project-route'),
            user:req.getHeader('x-json-quarry-user'),
            fn:req.getHeader('x-quarry-mapfn'),
            input:req.body
          }, function(error, output){
            
            if(error){
              res.error(error);
              return;
            }
            else{
              res.send(output.results);
            }
            
          })
        })
        
        codewarehouse.use(function(req, res, next){
          res.send404();
        })

        stack.warehouse.mount("/", codewarehouse);

        next();
        
      }
      
    ], done)
    

  }

  return job;
}