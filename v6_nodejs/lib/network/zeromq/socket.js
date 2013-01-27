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