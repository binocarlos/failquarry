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
var Instance = require('../instance');
var Bootloader = require('../bootloader');
var Node = require('../../stack/node');
var Client = require('./client');
var Base = require('../proto');
var singleton = require('./singleton');
var Gateway = require('../gateway');
var Webserver = require('../../webserver/proto');

/*
  Quarry.io - Development Deployment
  ----------------------------------

  All nodes run in the same process on a functional routed instance


 */

/*

  We only ever have one instance in a development stack



 */

var DevelopmentNetwork = module.exports = Base.extend({

  prepare:function(callback){
    Base.prototype.prepare.apply(this, [callback]);
  },

  // there is one single instance for a dev network
  load_instances:function(loaded){
    this.add_instance(new Instance({
      id:'development',
      hostname:'127.0.0.1'
    }))

    loaded();
  },

  // pile all the nodes onto the single instance
  allocate:function(loaded){
    var self = this;
    var development_instance = this.get_instance('development');

    self.allocate_gateway(development_instance);

    _.each(self.stacks, function(stack){

      self.emit('message', {
        text:'Allocate Stack: ' + stack.id,
        color:'red',
        depth:3
      })

      self.allocate_webserver(stack, development_instance);

      stack.recurse(function(node){
        self.allocate_node(stack, node, development_instance);
      })
    })

    loaded();
  },

  // boot the code inline
  deploy_rpc:function(deployment, loaded){

    var self = this;

    var node = deployment.node();
    var allocation = deployment.allocation();

    //var network = new Client(deployment.toJSON());
    var network = this.get_client(deployment.get('stack_id'));

    var bootloader = new Bootloader({
      deployment:deployment,
      network:network
    })

    self.rpc_message(deployment);

    bootloader.rpc(function(error, warehouse){

      if(error){
        loaded(error);
        return;  
      }
      

      /*
      
        here we assign the node to the singleton so we have easy access
        
      */
      singleton.rpc(deployment.get('stack_id'), allocation.node_id, warehouse);

      loaded();
    })
    
  },

  // boot the code inline
  deploy_webserver:function(stack_id, loaded){

    var self = this;

    var allocation = this.webservers[stack_id];
    var stack = self.stacks[stack_id];
    var websites = stack.websites;

    var webserver = new Webserver({
      ports:allocation.ports,
      websites:websites,
      client:self.get_client_config(stack_id)
    })

    singleton.webserver(stack_id, webserver);

    webserver.bind(loaded);
    
  },

  // boot the code inline
  deploy_gateway:function(loaded){

    var self = this;

    var gateway = new Gateway({
      ports:this.get('ports'),
      website_routing_table:this.website_routing_table(),
      client_provider:function(hostname, callback){
        callback(null, self.get_client(hostname));
      }
    })

    singleton.gateway(gateway);

    gateway.bind(loaded);
    
  },

  client_factory:function(data){
    return new Client(data);
  }
})