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