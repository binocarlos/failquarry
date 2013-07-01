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

var Website = require('../../website');

/*

  Quarry.io - Web
  ---------------

  The web worker can serve HTTP traffic for a stack

  It's front end is plugged into the stack router (HTTP load balancing)

  It's back end is plugged into the reception front (Quarry load balancing)

  Backend file suppliers will chunk their file contents over quarry

  The web workers are able to cache the file responses and so not stress
  the back end constatnly

  
*/

module.exports = function(job){

  job.prepare = function(done){

    var address = job.getaddress('http', 'http');

    var webserver_endpoints = {
      address:address,
      domains:{}
    }

    var stuff = {};

    /*
    
      build up the website app from it's tasklist

      this stage converts tasks into standard website config
      
    */
    function addwebsite(websiteconfig, callback){
      _.each(websiteconfig.hostnames || [], function(hostname){
        webserver_endpoints.domains[hostname] = true;
      })

      var website = Website(_.extend({}, websiteconfig, {
        id:job.id + ':' + utils.littleid(),
        receptionfront:stuff.receptionfront,
        io:stuff.webserver.io,
        hq:job.hq,
        cache:job.get_cache(),
        cookieSecret:stuff.webserver.cookieSecret,
        cookieParser:stuff.webserver.cookieParser,
        sessionStore:stuff.webserver.sessionStore
      }))

      website.plugin(function(){
        stuff.webserver.add_website(website.id, websiteconfig.hostnames || [], website);
        callback();
      })      
    }

    async.series([

      function(next){
        stuff.webserver = Device('http.server', {
          name:'Web server: ' + job.id,
          cacheoptions:job.get_cache_options(),
          address:address
        })
        stuff.webserver.plugin(next);
      },

      function(next){
        job.get_reception_front(function(error, receptionfront){
          stuff.receptionfront = receptionfront;
          next();
        })
      },

      function(next){

        var websiteconfigs = job.container.attr('websites') || [];

        async.forEachSeries(websiteconfigs, function(websiteconfig, nextwebsite){

          addwebsite(websiteconfig, nextwebsite);

        }, next)
        
      },

      function(next){
        job.register_dns(function(){
          return webserver_endpoints;
        });
        next();
      }
    ], done)

  }

  return job;
}