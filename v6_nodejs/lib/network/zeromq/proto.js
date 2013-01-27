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
var eyes = require('eyes');
var Socket = require('./socket');
var Emitter = require('events').EventEmitter;

module.exports = Proto;


/*
  Quarry.io - Proto
  -----------------

  Base class for both clients and servers


 */

function Proto(stack_id, ports){
  this.id = stack_id;
  this.ports = ports;
  this.sockets = [];
  this.build_sockets();
}

Proto.prototype.__proto__ = Emitter.prototype;

Proto.prototype.is_client = false;

Proto.prototype.build_sockets = function(){

}

Proto.prototype.socket_id = function(name){
  return this.id + ':' + name + (this.is_client ? ':client:' + process.pid : '');
}

Proto.prototype.add_socket = function(type, port){
  var socket = new Socket(this.socket_id(type), type, port);
  this.sockets.push(socket);
  return socket;
}