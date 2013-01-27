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