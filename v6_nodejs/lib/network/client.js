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
var eyes = require('eyes');
var BackboneDeep = require('../vendor/backbonedeep');
var Switchboard = require('../switchboard/proto');
var Warehouse = require('../warehouse');
var redis = require('../vendor/server/redis');

module.exports = BackboneDeep.extend({

  /*
  
    an instance of redback
    
  */
  cache:function(){
    var self = this;
    if(!self.cache_client){
      var redback = redis(self.resource('cache'));
      self.cache_client = redback.createCache(this.get('stack_id'));
    }

    return self.cache_client;
  },

  /*
  
    make a warehouse that is connected to the given supply point
    
  */

  warehouse:function(path, callback){
    var warehouse = new Warehouse();

    var supply_chain = this.rpc('/');
    var switchboard = this.pubsub();

    warehouse.networkmode = true;
    warehouse.switchboard = switchboard;
    warehouse.use(supply_chain);
    warehouse.ready(callback, path);

    return warehouse;
  },

  /*
    Produce a supply chain that points to a given node
   */
  rpc:function(path){

    var self = this;

    return function(req, res, next){
      res.send404();
    }
    
    
  },

  /*
  
    returns a switchboard implementation connected to the given path
    
  */
  pubsub:function(){
    var self = this;

    var switchboard = new Switchboard({
      ports:this.get('network.ports'),
      routing_key:this.get('stack_id')
    })

    return switchboard;
  },

  /*
  
    returns a function that you can pipe a string and a callback to

    this is useful for ZeroMQ sockets that do not need to parse the JSON request
    and just want to forward it's string to another endpoint in the network
    
  */
  raw:function(path){
    var self = this;

    return function(packet, callback){
      callback('this resource was not found: abstract method: client:raw');
    }
  },

  resource:function(name){
    return this.get('network.resources.' + name);
  },

  webserver_details:function(){
    var host = this.get('webserver.instance.hostname');
    var port = this.get('webserver.ports.http');

    return {
      host:host,
      port:port
    }
  }
})

