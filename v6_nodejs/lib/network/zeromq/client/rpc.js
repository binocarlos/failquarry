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
var Emitter = require('events').EventEmitter;
var Client = require('../client');
var Response = require('../../../query/response');
var utils = require('../../../utils');

module.exports = RPCClient;


/*
  Quarry.io - Local - PubSub
  -----------------------

  ZeroMQ server for warehouse PubSub


 */

function RPCClient(id, ports){

  Client.apply(this, [id, ports]);

  var self = this;

  // keep track of the callbacks via the request id
  this.callbacks = {};
}

RPCClient.prototype.__proto__ = Client.prototype;

RPCClient.prototype.build_sockets = function(){
  var self = this;
  
  this.rpc = this.add_socket('dealer', this.ports.rpc);

  this.rpc.on('message', function(){
  
    /*
    
      emit the arguments array (the parts of a multi-part message)

      we are still in Buffer mode (i.e. non-strings)
      
    */
    self.handle_answer.apply(self, _.toArray(arguments));
    
  })
}

/*

  message parts is an array of strings we we send down the wire

  the rpc client inserts
  
*/
RPCClient.prototype.request = function(message_parts, callback){

  var connection_id = utils.quarryid();

  /*
  
    inject the connection_id into the message parts

    the RPC server will return this as the first part of the response message
    
  */
  message_parts = ([connection_id]).concat(message_parts);

  this.callbacks[connection_id] = callback;

  this.rpc.send.apply(this.rpc, [message_parts]);
}

RPCClient.prototype.handle_answer = function(){

  var message_parts = _.toArray(arguments);

  var request_id = message_parts.shift().toString();
  var packet = message_parts.shift().toString();

  var fn = this.callbacks[request_id];

  if(!fn){
    return;
  }

  delete(this.callbacks[request_id]);

  fn(null, packet);
}