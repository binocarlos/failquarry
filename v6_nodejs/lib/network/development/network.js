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