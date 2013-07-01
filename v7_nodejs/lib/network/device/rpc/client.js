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

var _ = require('lodash');
var async = require('async');
var eyes = require('eyes');
var util = require('util');
var utils = require('../../../utils');
var Device = require('../../device');

module.exports = factory;

/*
  Quarry.io - RPC client
  ----------------------

  connects to an RPC server somewhere and holds onto the callback
  until we get an answer

  

 */

function factory(options){

  options || (options = {});
  options.name || (options.name = 'rpc_client');

  var client = Device('core.box', {
    name:options.name,
    wires:{
      socket:options
    }
  })

  var socket = client.wires.socket;
  var callbacks = {};

  client.send = function(routingpacket, payload, callback){
    var requestid = utils.quarryid();
    callbacks[requestid] = callback;
    var args = [requestid, routingpacket, payload];
    process.nextTick(function(){      
      socket.send.apply(socket, [args]);  
    })
    
  }


  socket.on('message', function(){

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('client in');
    var requestid = arguments[0].toString();
    var routingpacket = arguments[1];
    var payload = arguments[2];

    var callback = callbacks[requestid];
    if(!callback){
      return;
    }

    process.nextTick(function(){
      callback(payload);  
      delete(callbacks[requestid]);
    })
    
  })

  client.plugin = function(callback){
    if(client._pluggedin){
      callback && callback();
      return;
    }
    client._pluggedin = true;
    socket.plugin(callback);
  }

  return client;
}