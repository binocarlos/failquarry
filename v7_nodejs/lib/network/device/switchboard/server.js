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
var utils = require('../../../utils');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Device = require('../../device');

module.exports = factory;

/*
  Quarry.io - Switchboard Server
  ------------------------------

  A binding of a pub and sub as a central message broker

    pub - endpoint
    sub - endpoint  

 */

function factory(options){

  options || (options = {});
  options.name || (options.name = 'switchboard_server');

  var device = Device('core.box', {
    name:options.name,
    wires:{
      pub:options.pub,
      sub:options.sub
    }
  })

  /*

    the loopback so when you pub it emits
    
  */
  
  device.wires.sub.subscribe('');
  device.wires.sub.on('message', function(packet){
    process.nextTick(function(){
      device.wires.pub.send(packet);
    })
  })
  
  device.plugin = function(callback){
    if(device._pluggedin){
      callback && callback();
      return;
    }
    device._pluggedin = true;
    async.series([
      function(next){
        device.wires.pub.plugin(next);
      },
      function(next){
        device.wires.sub.plugin(next);
      }
    ], callback)
  }

  return device;
}