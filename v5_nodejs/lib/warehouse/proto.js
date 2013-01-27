/*!
 * Connect - HTTPServer
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/*
  Modifications for quarry.io

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
var utils = require('./utils');
var eyes = require('eyes');

module.exports = Warehouse;

/*
  Quarry.io - Warehouse
  ---------------------




 */

var app = module.exports = {};

// environment

var env = process.env.NODE_ENV || 'development';

/*
  To tell apart from containers in the container factory
 */
app.is_warehouse = true;


/*

  Add middleware to this warehouse's stack

 */
app.use = function(route, fn){
  // default route to '/' - this is the default root warehouse
  if ('string' != typeof route) {
    fn = route;
    route = '/';
  }

  // wrap sub-warehouses
  if ('function' == typeof fn.handle) {
    var server = fn;
    fn.route = route;
    fn = function(packet, next){
      server.handle(packet, next);
    };
  }

  // strip trailing slash
  if ('/' == route[route.length - 1]) {
    route = route.slice(0, -1);
  }

  // add the middleware
  debug('use %s %s', route || '/', fn.name || 'anonymous');
  this.stack.push({ route: route, handle: fn });

  return this;
};
