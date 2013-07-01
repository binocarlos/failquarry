/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/**
 * Module dependencies.
 */

var _ = require('lodash');
var async = require('async');
var osm = require("os-monitor");
var EventEmitter = require('events').EventEmitter;
/*

  quarry.io - worker monitor

  gets system information every N milliseconds and runs the callback with it

  the returned object has a cancel method

  
*/

module.exports = function(options){

  _.defaults(options, {
    delay: 5000,
    freemem: 250000000,
    critical1: 0.7,
    critical5: 0.7,
    critical15: 0.7
  })

  var monitor = {
    start:function(){
      osm.start(options);
    },
    isRunning:function(){
      return osm.isRunning();
    },
    stop:function(){
      return osm.stop();
    }
  }

  osm.on('monitor', function(event) {
    event.process = {
      title:process.title,
      pid:process.pid,
      memory:process.memoryUsage(),
      uptime:process.uptime()
    }
    monitor.emit('data', event);
  })

  _.extend(monitor, EventEmitter.prototype);

  return monitor;
}