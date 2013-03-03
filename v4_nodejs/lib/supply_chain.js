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
    EventEmitter = require('events').EventEmitter,
    containerFactory = require('./container'),
    async = require('async');
    
/*
  Quarry.io Supply Chain
  ----------------------

  reduce a selector by splitting it into the various parts

  the endpoint is a supply_chain that can run a 'selector' stage

  the router is either a function to which every stage is piped or an
  object to which the named stages are piped

  the router lets you force results to be sent back over the wire
  before continuing

  if the router does not match - the request is simply reduced in process
  and ends-up at the end-point

  this gives you total control over how and when the results leave the endpoint
  process to be filtered

 */

var api = {};

module.exports = api;

// create a supply chain entry function with (packet, callback)
//
// uses the provided actions to route by packet.action
//

api.supply_chain_factory = function(actions){

  return function(packet, callback){

    // if we have a function for 'action' - run it
    if(actions[packet.action]){

      actions[packet.action].apply(this, [packet, callback]);
    }
    else{
      packet.answer = {
        ok:false,
        error:packet.action + ' action not found'
      }

      callback(packet.answer.error, packet);
    }

  }
}

// a function that co-ordinates the reduction of a selector
api.reduce_select = function(endpoint, router, routing_key){

  // the default routes is all in memory until the endpoint
  var routes = {
    context:reducer,
    selector:reducer,
    phase:reducer,
    stage:endpoint
  };

  if(_.isFunction(router)){
    routes.context = router;
    routes.selector = router;
    routes.phase = router;
  }
  else if(_.isObject(router)){
    _.each(router, function(val, key){
      routes[key] = val;
    })
  }

  // make us a function that the results of the given step will
  // be sent to
  function packet_router(step, packet, callback){

    packet.action = 'select';
    packet.step = step;

    routes[step] ? routes[step](packet, callback) : null;

  }
  

  // the main recursion loop to reduce a selector
  function reducer(packet, main_callback){

    var message = packet.message;
    var step = packet.step;

    var selector = message.selector;
    var context = message.context;
    var skeleton = message.skeleton;


    // here we do not want 'root' containers to be involved in the selection
    var previous = _.filter(_.map(message.previous, function(prev){
      return _.isObject(prev) ? prev._meta.quarryid : prev;
    }), function(val){
      return val!=='root';
    })

    if(context){
      packet_router('context', {
        message:{
          selector:context,
          skeleton:true,
          previous:previous
        }
      }, function(error, first_packet){
        packet_router('selector', {
          message:{
            selector:selector,
            previous:first_packet.answer.results
          }
        }, function(error, final_packet){
          packet.answer = final_packet.answer;
          main_callback(error, packet);
        });
      })
    }
    else{
      // we have multiple phases - pipe them in parallel
      if(selector.length>1){

        var all_results = [];

        async.forEach(selector, function(phase, phase_callback){

          // trigger the phase through the router - it might even end up above!
          packet_router('phase', {
            message:{
              selector:[phase],
              skeleton:skeleton,
              previous:previous
            }
          }, function(error, phase_packet){
            all_results = all_results.concat(phase_packet.answer.results);
            phase_callback();
          })

        }, function(error){

          // all phases are run - we have merged results - return them!
          packet.answer = {
            ok:true,
            results:all_results
          }

          main_callback(error, packet);
        })
      }
      // this is where we actuall do some work
      else{

        // here we have a single phase because it has been reduced for us
        var phase = selector[0];

        // skeleton or full mode switch
        var stage_counter = 0;

        // as soon as no results for a stage we bail out
        var bailed_out = false;

        // loop the phases of the selector - replace the previous list each time
        async.forEachSeries(phase, function(stage, stage_callback){

          // no more to do because there were no results the last time
          if(bailed_out){
            stage_callback();
            return;
          }
          
          // so lets run the stage via the router
          packet_router('stage', {
            message:{
              selector:[[stage]],
              skeleton:stage_counter < phase.length-1 || skeleton,
              previous:previous
            }
          }, function(error, packet){

            stage_counter++;

            previous = packet.answer.results;

            // if we have no results then bail out of the other stages
            if(previous.length<=0){
              bailed_out = true;
            }

            stage_callback(error)
          })

          
        }, function(error){

          packet.answer = {
            ok:true,
            results:previous
          }
          // we have full data here
          main_callback(error, packet);
        })
      }
    }
  }

  return reducer;
}