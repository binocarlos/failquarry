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
var EventEmitter = require('events').EventEmitter;
/*

  quarry.io - worker heartbeat

  simple looping event emitter

  
*/

module.exports = function(options){

  options = _.defaults(options, {
    delay: 1000
  })

  var heartbeat = {
    counter:0,
    delay:options.delay,
    start:function(newdelay){
      if(newdelay){
        this.delay = newdelay;
      }
      this.cancelid = setInterval(_.bind(this.beat, this), this.delay || 1000);
    },
    beat:function(){
      this.counter++;
      this.emit('beat', this.counter);
    },
    isRunning:function(){
      return this.cancelid!=null;
    },
    stop:function(){
      clearInterval(this.cancelid);
      this.cancelid = null;
    }
  }

  _.extend(heartbeat, EventEmitter.prototype);

  return heartbeat;
}