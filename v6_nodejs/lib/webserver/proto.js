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
var eyes = require('eyes');
var EventEmitter = require('events').EventEmitter;
var express = require('express');
var colors = require('colors');
var Website = require('./website');
var network_factory = require('../network');
var http = require('http');
var socketio = require('socket.io');

//var Proto = require('./proto');

module.exports = Webserver;

function Webserver(options){
  var self = this;
  options || (options = {});

  this.ports = options.ports;
  this.website_configs = options.websites;
  this.network_config = options.client;

  this.websites = {};

  /*
  
    the front door webserver routing app that will actually listen to a port
    
  */
  this.router = express();

  /*
  
    the HTTP server hosting the router app
    
  */
  this.server = http.createServer(this.router);

  /*
  
    the server socket io that will use namespaces for virtual hosts
    
  */
  this.io = socketio.listen(this.server);

  if(process.env.NODE_ENV=='production'){
    this.io.enable('browser client minification');
    this.io.enable('browser client etag');
    this.io.enable('browser client gzip');
  }
  
  this.io.set('log level', 1);
  this.io.set('transports', [
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ])

}

Webserver.prototype.__proto__ = EventEmitter.prototype;

Webserver.prototype.bind = function(ready_callback){
  var self = this;
  this.load_websites(function(error){
    if(error){
      ready_callback(error);
      return;
    }

    self.router.use(function(req, res, next){
      res.send('website not found for stack: ' + self.network_config.stack_id);
    })

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('web server binding on port: ' + ('' + self.ports.http).red);

    self.server.listen(self.ports.http);

    ready_callback();
  })
}

Webserver.prototype.load_websites = function(loaded_callback){
  var self = this;

  async.series([
    /*
    
      first load up the network client
      
    */
    function(next){

      var network_type = self.network_config.network.type;

      self.network_client = network_factory.client(network_type, self.network_config);
      
      next();
    },

    /*
    
      now each website
      
    */
    function(next){
      async.forEach(_.keys(self.website_configs), function(website_id, next_website){
        var website_config = self.website_configs[website_id];

        var website = new Website({
          config:website_config,
          network_client:self.network_client,
          io:self.io
        })

        website.initialize(function(error){
          if(error){
            next_website(error);
            return;
          }

          self.websites[website_id] = website;  

          _.each(website.hostnames(), function(hostname){
            console.log('-------------------------------------------');
            console.log('mapping domain');
            eyes.inspect(hostname);
            self.router.use(express.vhost(hostname, website.express_handler()));
          })

          next_website();
        })

      }, next)
    }
  ], loaded_callback)
  
}