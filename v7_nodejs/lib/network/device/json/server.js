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
  Quarry.io - JSON Server
  ----------------------

  rpc server wrapper that does JSON conversion

  

 */

function factory(options){

  var socket = options.socket;

  if(!socket){
    throw new Error('json server wants a socket');
  }

  function jsonmessage(routingpacket, payload, callback){
    var routing_json = JSON.parse(routingpacket.toString());
    var payload_json = JSON.parse(payload.toString());

    process.nextTick(function(){
      jsonserver.emit('jsonmessage', routing_json, payload_json, function(answer){
        var answer_string = JSON.stringify(answer);
        process.nextTick(function(){
          callback(answer_string);
        })
      })  
    })
    
  }

  var jsonserver = Device('core.box');
  
  socket.on('message', jsonmessage);

  jsonserver.jsonmessage = jsonmessage;

  return jsonserver;
}