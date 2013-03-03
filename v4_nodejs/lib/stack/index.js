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
