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


/*

  Quarry.io - reception
  ---------------------

  

  
  
*/

module.exports = function(job){

  job.prepare = function(done){
    
    /*
      
      this assigns the endpoints we use for the reception server
      
    */
    var reception_endpoints = {
      front:job.getaddress('quarry'),
      back:job.getaddress('quarry')
    }

    var stuff = {};

    async.series([
      function(next){
        stuff.receptionserver = Device('reception.server', _.extend({
          name:'Reception server: ' + job.id,
          id:job.id
        }, reception_endpoints));

        stuff.receptionserver.on('route', function(message){
          console.log('-------------------------------------------');
          console.log('reception route:');
          eyes.inspect(message);
        })

        stuff.receptionserver.on('error', function(message){
          console.log('-------------------------------------------');
          console.log('reception error:');
          eyes.inspect(message);
        })

        stuff.receptionserver.plugin(function(){
          reception_endpoints.wireids = stuff.receptionserver.wireids;
          next();
        })
      },

      function(next){
        job.get_reception_front(function(error, receptionfront){
          stuff.receptionfront = receptionfront;
          next();
        })
      },

/*
      function(next){
        _.each(job.container.attr('middleware') || [], function(middlewareconfig){
          var modulename = middlewareconfig.module.replace(/^quarry\./, '').replace(/\./g, '/');
          var Module = require('./reception/' + modulename);

          var fn = Module(middlewareconfig, {
            receptionfront:stuff.receptionfront
          })

          stuff.receptionserver.use(fn);
        })
        next();
      },
*/
      function(next){
        job.register_dns(function(){
          return reception_endpoints;
        })
        next();
      }
    ], done)
  }

  return job;
}