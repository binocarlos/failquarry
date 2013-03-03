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
var zmq = require('zeromq-port');
var Emitter = require('events').EventEmitter;

module.exports = Socket;

function array_to_string(packet){
  return packet[0];
}

var packet_filters = {
  pub:array_to_string,
  sub:array_to_string
}

/*
  Quarry.io - Local - PubSub
  -----------------------

  ZeroMQ server for warehouse PubSub


 */

function Socket(id, type, port){

  var self = this;

  this.id = id;
  this.type = type;
  this.port = port;

  this._socket = zmq.socket(this.type);
  this._socket.identity = this.id;

  this._socket.on('message', function(){
    self.emit.apply(self, ['message'].concat(_.toArray(arguments)));
  })
}

Socket.prototype.__proto__ = Emitter.prototype;

Socket.prototype.send = function(packet){
  this._socket.send.apply(this._socket, [packet]);
}

Socket.prototype.subscribe = function(routing_key){
  this._socket.subscribe(routing_key);
}

Socket.prototype.unsubscribe = function(routing_key){
  this._socket.unsubscribe(routing_key);
}

Socket.prototype.bind = function(){
  console.log('-------------------------------------------');
  console.log('Socket bind (' + this.type + '): ' + this.address());

  this._socket.bindSync(this.address());

  this.keepAlive();
  this.wrapExit();
}

Socket.prototype.connect = function(){
  console.log('-------------------------------------------');
  console.log('Socket connect (' + this.type + '): ' + this.address());  

  this._socket.connect(this.address());
}

Socket.prototype.address = function(){
  return 'tcp://127.0.0.1:' + this.port;
}

Socket.prototype.keepAlive = function(){

  // stops node.js dieing if there is no work
  setInterval(function(){
    // heartbeat
    
  }, 60000);

  
}

/*

  make sure the socket shuts down cleanly (bad things happen otherwise)

 */
Socket.prototype.wrapExit = function(){
  var self = this;
  // means we can control+C without any trouble
  process.on('SIGINT', function() {
    self._socket.close();
    process.exit();
  });
}