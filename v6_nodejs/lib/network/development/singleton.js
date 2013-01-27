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