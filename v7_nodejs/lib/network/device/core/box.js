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
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var eyes = require('eyes');
var Device = require('../../device');
var utils = require('../../../utils');
var Wire = require('./wire');

module.exports = factory;

/*
  Quarry.io - Device
  ------------------

  a collection of ZeroMQ sockets configured to act as a group

  options:

    id:         (stack device id)

    wires: (map of child sockets)

      name -> id:     ( socket identity )
      type:   (device factory type)
      direction: ( bind | connect | parent )
      address: ( 'ipc:/filepath' | 'tcp://x.x.x.x:yyyy' )


    -> 

    id:id
    sockets: {}

      it will turn the children array into a socket map

 */



function factory(options){

  options || (options = {
    name:'device' + utils.littleid()
  })

  var box = {
    name:options.name,
    devices:{},
    wires:{}
  }

  _.extend(box, EventEmitter.prototype);

  _.each(options.devices, function(deviceoptions, name){
    deviceoptions.name = options.name + ':' + name;
    deviceoptions.manual = options.manual ? true : false;
    box.devices[name] = Device(deviceoptions.type, deviceoptions);
  })

  _.each(options.wires, function(wireoptions, name){
    wireoptions.name = options.name + ':' + name;
    wireoptions.manual = wireoptions.manual ? true : false;
    box.wires[name] = Wire(wireoptions);
  })

  return box;
}
