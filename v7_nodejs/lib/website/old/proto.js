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

var _ = require('lodash');
var async = require('async');
var utils = require('../utils');
var eyes = require('eyes');
var EventEmitter = require('events').EventEmitter;
var express = require('express');
var Website = require('./website');
var http = require('http');
var socketio = require('socket.io');
var log = require('logule').init(module, 'Web Server');
var util = require('util');
var path = require('path');
var dye = require('dye');
var RedisStore = require('./tools/redisstore')(express);
var passportSocketIo = require('passport.socketio');
//var Proto = require('./proto');

module.exports = Webserver;

function Webserver(node, system){
  EventEmitter.call(this);
  var self = this;
  
  this.node = node;
  this.options = node.attr();
  this.system = system;
  
  if(!this.options){
    throw new Error('Webserver needs options');
  }

  if(!this.system){
    throw new Error('Webserver needs system');
  }

  _.each(['supplychain', 'cache', 'endpoint', 'worker'], function(prop){
    if(!system[prop]){
      throw new Error('Webserver needs a ' + prop);
    }
  })

  /*
  
    map of id onto website
    
  */
  this.websites = {};

  /*
  
    map of domain onto website
    
  */

  this.domains = {};

  /*
  
    the HTTP server hosting the router app
    
  */
  this.server = http.createServer(function(req, res){
    var hostname = req.headers.host.toLowerCase();
    var app = self.domains[hostname];

    function notfound(){
      res.statusCode = 404;
      res.end(req.url + ' not found');
    }

    app ? app(req, res, notfound) : notfound();
  })

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

  this.cookieSecret = 'rodneybatman';
  this.cookieParser = express.cookieParser(this.cookieSecret);
  this.sessionStore = new RedisStore(system.worker.cache);

  this.io.set('authorization', passportSocketIo.authorize({
    key:'connect.sid',
    secret:this.cookieSecret,
    store:this.sessionStore,
    fail:function(data, accept){
      accept(null, true);
    },
    success:function(data, accept) {
      accept(null, true);
    }
  }))

  //this.sockets = sessionSockets = new SessionSockets(this.io, this.sessionStore, this.cookieParser);
  this.sockets = this.io;
}

util.inherits(Webserver, EventEmitter);

Webserver.prototype.addwebsite = function(website, ready_callback){
  var self = this;

  var website_config = website.attr();

  _.extend(website_config, {
    document_root:path.resolve(this.system.worker.stack.codefolder, website.attr('document_root')),
    script_root:path.resolve(this.system.worker.stack.codefolder, website.attr('script_root')),
    sessionStore:this.sessionStore,
    cookieSecret:this.cookieSecret,
    cookieParser:this.cookieParser,
    socketid:utils.littleid(),
    sockets:this.sockets
  })
  
  log.info('Mounting Website: ' + dye.red(website_config.name) + ' - ' + dye.yellow(website_config.document_root));

  var website = new Website(website_config);

  website.initialize(self.system, function(error){
    if(error){
      next_website(error);
      return;
    }

    self.websites[website.hostname()] = website;  

    _.each(website.hostnames(), function(hostname){
      log.info('Mapping domain: ' + dye.yellow(hostname));
      self.domains[hostname.toLowerCase()] = website.app;
    })

    ready_callback();
  })
}

Webserver.prototype.bind = function(ready_callback){
  var self = this;

  log.info('web server binding on port: ' + dye.red(self.system.endpoint.port));

  self.server.listen(self.system.endpoint.port, function(){
    ready_callback();
  })

}

Webserver.prototype.load_websites = function(loaded_callback){
  var self = this;

  async.series([

    /*
    
      now each website
      
    */
    function(next){
      async.forEach(self.node.find('service').containers() || [], function(website, next_website){
        
        self.addwebsite(website, next_website);

      }, next)
    }

  ], loaded_callback)
  
}