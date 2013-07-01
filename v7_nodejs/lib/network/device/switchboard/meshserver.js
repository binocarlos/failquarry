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
var deck = require('deck');

var Device = require('../../device');

module.exports = factory;

/*
  Quarry.io - Mesh Switchboard Client
  -----------------------------------

  a collection of map locations representing the switchboard servers
  on one stack

  we pick one at random to use

  

 */


function factory(options){

  /*
  
    the pool of switchboard server locations
    
  */
  var pool = {};

  /*
  
    the id of the currently used switchboard server for this meshclient
    
  */
  var currentid = null;
  var triggered = false;
  var dns = options.dns;

  /*
  
    this is a dummy client - it won't do anything until we give it
    some active wires at which point the callbacks and subscriptions
    get injected into the new wires

    this is also what happens when a switchboard server goes away,
    we just replace the existing wires with some new ones and re-bind
    all of the subscription keys
    
  */
  var device = Device('core.box', {
    name:options.name,
    wires:{
      pub:{
        type:'pub',
        direction:'bind',
        address:options.pub
      },
      sub:{
        type:'sub',
        direction:'bind',
        address:options.sub
      },
      sidewayspub:{
        type:'pub',
        direction:'bind',
        address:options.sidewayspub
      },
      sidewayssub:{
        type:'sub',
        direction:'bind',
        address:options.sidewayssub
      }
    }
  })

  /*
  
    the loopback so when you pub it emits
    
  */
  var sideways_pairs = {};

  function sideways_publish(packet){
    _.each(sideways_pairs, function(sideways_pair){
      sideways_pair.pub.send(packet);
    })
  }

  function register_pair(id, pair){
    sideways_pairs[id] = pair;

    pair.pub.plugin();
    pair.sub.plugin();
  }

  function remove_pair(id){
    var pair = sideways_pairs[id];
    if(pair){
      pair.pub.close();
      pair.sub.close();
    }
    delete(sideways_pairs[id]);
  }

  device.wires.sub.on('message', function(packet){
    process.nextTick(function(){
      device.wires.pub.send(packet);
      sideways_publish(packet);
    })
  })
  device.wires.sub.subscribe('');

  device.wires.sidewayssub.on('message', function(packet){
    process.nextTick(function(){
      device.wires.pub.send(packet);
    })
  })
  device.wires.sidewayssub.subscribe('');

  function addswitchboard(message){
    if(message.jobid==options.jobid){
      return;
    }

    /*
    
      make a new wire sideways, hook it onto the sub here and the pub there

    */
    register_pair(message.id, {
      pub:Device('core.wire', {
        type:'pub',
        direction:'connect',
        address:message.sidewayssub
      }),
      sub:Device('core.wire', {
        type:'sub',
        direction:'connect',
        address:message.sidewayspub
      })
    })
  }

  function removeswitchboard(message){
    if(!message){
      return;
    }
    
    if(message.id==options.jobid){
      return;
    }

    remove_pair(message.id);
    
    
  }

  dns.listen('switchboard', addswitchboard, removeswitchboard);

  device._pluggedin = false;
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
      },
      function(next){
        device.wires.sidewayspub.plugin(next);
      },
      function(next){
        device.wires.sidewayssub.plugin(next);
      }
    ], callback)
  }

  return device;
}