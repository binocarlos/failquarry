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

var _ = require('underscore'),
    EventEmitter = require('events').EventEmitter,
    db_factory = require('./db'),
    async = require('async');

/*
  Quarry.io Stack
  ---------------

  A small arrangement of functions using a deployment

  Make a new stack that is capable of routing messages through it's processes
  A stack has a 'interface' of a certain character for in and out

 */

function factory(deployment){

  options = options || {};

  var stack = Object.create(EventEmitter.prototype);

  // the entry functions
  var entries = {};

  // the exit functions
  var exits = {};

  // the end-point functions
  var endpoints = {};

  /*
    Trigger an entry point with a message
   */
  stack.run = function(name, message, callback){
    if(arguments.length==2){
      callback = message;
      message = name;
      name = 'default';
    }

    entries[name].apply(stack, [_.isString(message) ? JSON.parse(message) : message, callback]);
    return this;
  }

  /*
    Assign an entry function
   */
  stack.entry = function(name, func){
    !func && (
      func = name;
      name = 'default';
    )
    entries[name] = func;
    return this;
  }

  /*
    Assign an exit function
   */
  stack.exit = function(name, func){
    !func && (
      func = name;
      name = 'default';
    )
    exits[name] = func;
    return this;
  }

  /*
    Assign a named end-point

   */
  stack.endpoint = function(name, func){
    endpoints[name] = func;
    return this;
  }

  return stack;
}

exports = module.exports = factory;
