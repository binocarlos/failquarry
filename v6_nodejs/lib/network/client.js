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

