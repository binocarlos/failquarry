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
  var dns = options.dns;

  var triggered = false;

  /*
  
    this is a dummy client - it won't do anything until we give it
    some active wires at which point the callbacks and subscriptions
    get injected into the new wires

    this is also what happens when a switchboard server goes away,
    we just replace the existing wires with some new ones and re-bind
    all of the subscription keys
    
  */

  var switchboardclient = Device('switchboard.client', {
    name:options.name || 'switchboardclient',
    stackid:options.stackid || 'hq',
    pub:{
      type:'pub',
      direction:'connect'
    },
    sub:{
      type:'sub',
      direction:'connect'
    }
  })

  function injectconnection(message){
    currentid = message.id;

    var pubwire = Device('core.wire', {
      type:'pub',
      direction:'connect',
      address:message.sub
    })

    var subwire = Device('core.wire', {
      type:'sub',
      direction:'connect',
      address:message.pub
    })

    switchboardclient.replacewires(pubwire, subwire);
    switchboardclient._dev = true;
  }

  /*
  
    a new connection has popped up

    see if we already have one or if this is the one we will use

    all of the servers begin their heartbeats on a random 1000 ms window

    also - the first initial selection from this end is random within 1000 ms

    the combination of random at both ends means we can announce lots of servers
    and have them randomly load-balanced

    the map back on the HQ server is able to detect an over-allocation of switchboard
    clients onto one server

    RPC is different because they all inter-connect in a true mesh

    the switchboard mesh is a one at a time fallback mesh
    
  */
  function addconnection(message){

    pool[message.id] = message;

    if(triggered){
      return;
    }

    if(currentid){
      return;
    }

    triggered = true;

    /*
    
      this means we are currently connectionless

      we create some new pub/sub wires pointing to a random
      item within the pool
      
    */
    setTimeout(function(){
      pickconnection();  
    }, 200 + (Math.round(Math.random()*1000)))

  }


  function removeconnection(message){

    if(!message){
      return;
    }

    delete(pool[message.id]);

    /*
    
      yikes - we have lost our current selection,
      get another one if possible
      
    */
    if(message.id==currentid){
      currentid = null;
      pickconnection();
    }
  }


  /*
  
    randomly select a connection and inject the wires into the device
    
  */
  function pickconnection(){
    var keys = _.keys(pool);

    /*
    
      if we have no connections the keep asking until we get one
      
    */
    if(keys.length<=0){
      setTimeout(function(){
        pickconnection();
      }, 1000)
    }
    else{
      triggered = true;
      injectconnection(pool[deck.pick(keys)]);  
    }
    
  }

  dns.listen('switchboard', addconnection, removeconnection);
  /*
  
    fake the plugin until we get a connection
    
  */
  switchboardclient._pluggedin = true;
  return switchboardclient;
}