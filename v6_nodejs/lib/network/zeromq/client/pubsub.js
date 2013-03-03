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