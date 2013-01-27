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

var _ = require('underscore');
var async = require('async');
var eyes = require('eyes');
var Emitter = require('events').EventEmitter;
var Client = require('../client');

module.exports = PubSubClient;


/*
  Quarry.io - Local - PubSub
  -----------------------

  ZeroMQ server for warehouse PubSub


 */

function PubSubClient(id, ports){
  Client.apply(this, [id, ports]);

  /*
  
    a map of routingkey onto array of functions
    
  */
  this.callbacks = {};
}

PubSubClient.prototype.__proto__ = Client.prototype;

PubSubClient.prototype.build_sockets = function(){
  var self = this;

  /*
  
    pub -> sub
    sub -> pub

    they are backwards because this is the client
    it's like a cross-over cable
    
  */

  /*
  
    the PUB connects to the SUB to write
    
  */
  this.pub = this.add_socket('pub', this.ports.sub);

  /*
  
    the SUB connects to the PUB to listen
    
  */
  this.sub = this.add_socket('sub', this.ports.pub);

  this.sub.on('message', function(data){

    var packet = data.toString();
    var spaceIndex = packet.indexOf(' ');
    var routing_key = packet.substr(0, spaceIndex);
    var message = packet.substr(spaceIndex+1);

    self.trigger_callbacks(routing_key, JSON.parse(message));
    
  })
}

PubSubClient.prototype.trigger_callbacks = function(routing_key, message){
  var self = this;
  
  _.each(self.callbacks[routing_key], function(fn){
    fn(message);
  })
  return this;
}

PubSubClient.prototype.listen = function(channel, routingKey, fn){

  var self = this;

  routingKey = channel + '.' + routingKey;

  self.callbacks[routingKey] || (self.callbacks[routingKey] = []);

  self.callbacks[routingKey].push(fn);

  console.log('-------------------------------------------');
  console.log('zeromq client subscribing: ' + routingKey);

  this.sub.subscribe(routingKey)
}

PubSubClient.prototype.broadcast = function(channel, routingKey, message){


  var self = this;

  routingKey = channel + '.' + routingKey;

  console.log('-------------------------------------------');
  console.log('broadcast');
  eyes.inspect(routingKey);

  this.pub.send(routingKey + ' ' + JSON.stringify(message));
}

PubSubClient.remove = function(channel, routingKey, fn){
  console.log('-------------------------------------------');
  console.log('remove');
  eyes.inspect(channel);
  eyes.inspect(routingKey);

  routingKey = channel + '.' + routingKey;

  self.callbacks[routingKey] || (self.callbacks[routingKey] = []);

  self.callbacks[routingKey] = _.filter(self.callbacks[routingKey], function(testfn){
    return testfn!==fn;
  })
}

PubSubClient.removeAll = function(channel, routingKey){
  console.log('-------------------------------------------');
  console.log('remove all');
  eyes.inspect(channel);
  eyes.inspect(routingKey);

  routingKey = channel + '.' + routingKey;

  self.callbacks[routingKey] = [];
}