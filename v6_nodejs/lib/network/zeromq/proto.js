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