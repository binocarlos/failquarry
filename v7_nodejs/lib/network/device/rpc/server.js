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
  Quarry.io - RPC Server
  ----------------------

  string server that sends request ids back for the client to trigger a callback

  

 */

function factory(options){

  options || (options = {});
  options.name || (options.name = 'rpc_server');

  var server = Device('core.box', {
    name:options.name,
    wires:{
      socket:options
    }
  })

  var socket = server.wires.socket;

  socket.on('message', function(){


    var socketid = arguments[0];
    var requestid = arguments[1];
    var routingpacket = arguments[2];
    var payload = arguments[3];

    /*
    
      we pass on the header (JSON parsed) and payload (raw)
      
    */
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('emmiting');
    server.emit('message', routingpacket, payload, function(answer){
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('sending');
      eyes.inspect(socketid.toString());
      var args = _.map([socketid, requestid, routingpacket, answer], function(arg){
        return arg.toString();
      })
      eyes.inspect(args);
      socket.send([socketid, requestid, routingpacket, answer]);
      
    })
    
  })

  server.plugin = function(callback){
    if(server._pluggedin){
      callback && callback();
      return;
    }
    server._pluggedin = true;
    socket.plugin(callback);
  }

  return server;
}