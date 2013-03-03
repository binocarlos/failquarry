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
var utils = require('../../utils');
var eyes = require('eyes');

/*
  Quarry.io - Development Network Singleton
  -----------------------------------------

  We are all in process so we have on client for the lot

  


 */
function Singleton(){
  this.stacks = {};
  this.webservers = {};
  this.gatewayserver = null;
}

Singleton.prototype.ensure_stack = function(stack_id){
  this.stacks[stack_id] || (this.stacks[stack_id] = {
    pubsub:{},
    rpc:{}
  })

  return this.stacks[stack_id];
}

Singleton.prototype.pubsub = function(stack_id, path, server){
  var stack = this.ensure_stack(stack_id);
  if(server){
    stack.pubsub[path] = server;
  }
  return stack.pubsub[path];
}

Singleton.prototype.gateway = function(server){
  if(server){
    this.gatewayserver = server;
  }
  return this.gatewayserver;
}

Singleton.prototype.webserver = function(stack_id, server){
  if(server){
    this.webservers[stack_id] = server;
  }
  return this.webservers[stack_id];
}

Singleton.prototype.rpc = function(stack_id, path, server){
  var stack = this.ensure_stack(stack_id);
  if(server){
    stack.rpc[path] = server;
  }
  return stack.rpc[path];
}

module.exports = new Singleton();