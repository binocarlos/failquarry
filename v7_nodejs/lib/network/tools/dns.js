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
var eyes = require('eyes');
var EventEmitter = require('events').EventEmitter;
var Heartbeat = require('./heartbeat');
var Container = require('../../container');
var Device = require('../device');

/*

  quarry.io - DNS

  hooks into the HQ switchboard and broadcasts / listens for 
  department jobs popping up

  when a job 'registers' (like reception and switchboards do)
  they will start emitting their endpoints over a heartbeat

  when a job 'listens' it will revieve these heartbeats for
  certain servers (here are the reception servers currently etc)

  This is how the routing works

  
*/

module.exports = function(options){

  options = _.defaults(options, {
    talkdelay: 1000,
    worrydelay: 3000
  })

  if(!options.endpoints){
    throw new Error('map client requires a switchboard!');
  }

  if(options.worrydelay<options.talkdelay*3){
    throw new Error('the map client worry delay must be at least 3 times the talk delay');
  }

  var switchboard = Device('switchboard.standardclient', {
    name:'DNS client',
    endpoints:options.endpoints
  })

  var connections = {};
  var dnsclient = {};
  var listening = {};

  _.extend(dnsclient, EventEmitter.prototype);

  /*
  
    we are a XXXXXX server and want to tell everyone our endpoints
    
  */
  dnsclient.register = function(department, datafn){

    var heartbeat = Heartbeat({
      delay:1000
    })

    heartbeat.on('beat', function(counter){
      var data = datafn() || {};
      data.timestamp = new Date().getTime();
      data.department = department;
      switchboard.broadcast('route.' + department, data);
    })

    /*
    
      start emitting location updates over radio
      
    */
    setTimeout(function(){
      heartbeat.start();  
    }, 200 + (Math.round(Math.random()*1000)))
    
    return this;
  },

  /*
  
    we want to know where all of the XXXXX servers are
    
  */
  dnsclient.listen = function(department){

    if(listening[department]){
      return this;
    }

    listening[department] = true;
    start_checking();

    connections[department] || (connections[department] = {});

    var useconnections = connections[department];

    /*
    
      setup the listener that will collect the updates from locations
      
    */
    switchboard.listen('route.' + department, function(message){      
      if(message.department!=department){
        return;
      }
      message.timestamp = new Date().getTime();
      if(!useconnections[message.id]){
        dnsclient.emit('add', message);
      }
      useconnections[message.id] = message;
    })
   
    return this; 
  }

  dnsclient.plugin = _.bind(switchboard.plugin, switchboard);
  
  var ischecking = false;

  function check(){

    var currentstamp = new Date().getTime();

    _.each(connections, function(department, department_name){
      _.each(department, function(data, id){
        var gap = currentstamp - data.timestamp;

        if(gap>options.worrydelay){
          dnsclient.emit('remove', connections[id]);
          delete(connections[id]);
        }
      })
    })
    /*
    
      we keep checking the current connections for stale ones
      
    */
    setTimeout(function(){
      check();

    }, options.talkdelay)
  }

  function start_checking(){
    if(ischecking){
      return;
    }

    check();
  }

  return dnsclient;
}