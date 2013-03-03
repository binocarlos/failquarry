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

var _ = require('underscore'),
    containerFactory = require('../container'),
    eyes = require('eyes'),
    async = require('async');
    
/*
  Quarry.io Switchboard Supply Chain
  --------------------------------

  wraps another supply chain and emits and event from each packet once it has
  returned from the original supply chain

  it also passes the packet back to the original callback

 */

module.exports = factory;

var ignore_actions = {
  select:true,
  serve:true
}

function factory(base_chain, datasource){

  // the names of actions that are not broadcast
  var silent_actions = {

  }
  // the array of listening functions
  var stack = [];

  function emit_packet(packet){
    if(ignore_actions[packet.action]){
      return;
    }
    _.each(stack, function(cb){
      cb(packet);
    })
  }

  function switchboard(packet, callback){

    base_chain(packet, function(error, answer_packet){
      emit_packet(answer_packet);
      callback(error, answer_packet);
    })

  }

  // hook up the datasource with the emitter
  // this is so we can co-ordinate many servers into the same event pool
  datasource && datasource(emit_packet);

  // register callbacks for this switchboard - any events will be run through these
  switchboard.use = function(fn){
    stack.push(fn);
    return this;
  }

  return switchboard;
}