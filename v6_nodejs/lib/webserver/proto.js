/*
  Copyright (c) 2012 All contributors as noted in the AUTHORS file

  This file is part of quarry.io

  quarry.io is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  quarry.io is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
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