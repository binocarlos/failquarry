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
var utils = require('../../../utils');
var eyes = require('eyes');
var express = require('express');
var RedisStore = require('../../tools/redisstore')(express);
var SessionSockets = require('session.socket.io');

/*

  Browser supply chain with socket.io
  
*/
module.exports.configure = function(options, callback){

  var app = options.app;
  var mixin_options = options.mixin_options;
  var website_options = options.website_options;
  var network_client = options.network_client;
  var io = options.io;

  var route = mixin_options.httproute;

  var cookieParser = express.cookieParser(website_options.cookie_secret);
  var sessionStore = new RedisStore(network_client.resource('cache'));

  app.sockets = new SessionSockets(io, sessionStore, cookieParser);

  callback();
}

module.exports.route = function(options, callback){
  
  var app = options.app;
  var website_options = options.website_options;
  var mixin_options = options.mixin_options;

  var website_id = website_options.id.replace(/\./g, '_');

  var route = mixin_options.route;

  app.sockets.of('/' + website_id).on('connection', function (err, socket, session) {
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('CONNECTED!!!: ' + website_id);
  })
  
  app.get(route + '/warehouse.js', function(req, res, next){

  })


  callback();
}