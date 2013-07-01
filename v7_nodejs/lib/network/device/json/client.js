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
  Quarry.io - JSON Client
  ----------------------

  rpc client wrapper that converts the header and payload to JSON

  

 */

function factory(options){

  if(!options.socket){
    throw new Error('json client wants a socket');
  }

  var socket = options.socket;

  var jsonclient = Device('core.box');

  jsonclient.jsonsend = function(routingpacket, payload, callback){
    var routing_string = JSON.stringify(routingpacket);
    var payload_string = JSON.stringify(payload);

    process.nextTick(function(){
      socket.send(routing_string, payload_string, function(answer){
        var json_result = JSON.parse(answer.toString());
        process.nextTick(function(){
          callback(json_result);  
        })
        
      })
    })
  }

  return jsonclient;
}