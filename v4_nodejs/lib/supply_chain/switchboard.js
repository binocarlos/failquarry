/*
  Copyright (c) 2012 All contributors as noted in the AUTHORS file

  This file is part of quarry.io

  quarry.io is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  quarry.io is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
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