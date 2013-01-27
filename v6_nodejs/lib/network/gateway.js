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
var utils = require('../utils');
var eyes = require('eyes');
var ZMQRPC = require('./zeromq/server/rpc');
var ZMQPubSub = require('./zeromq/server/pubsub');
var bouncy = require('bouncy');

/*
  Quarry.io - Gateway
  -------------------

  The overall entry point for a network

  This will decide what stack to route to based on hostname (virtual hosting)


 */
module.exports = Gateway;
/*


  Constructor




 */

function Gateway(options){
  options || (options = {});
  /*
  
    the ports we are running our servers on
    
  */
  this.ports = options.ports;

  /*
  
    the function that will provide us with a client to the internal network
    
  */
  this.client_provider = options.client_provider;

  /*
  
    a cache of the clients that have already been accessed
    
  */
  this.clients = {};

  /*
  
    a list of domain names onto stack id
    
  */
  
  this.website_routing_table = options.website_routing_table;
}

Gateway.prototype.ensure_client = function(hostname, callback){
  var self = this;
  if(this.clients[hostname]){
    callback(null, this.clients[hostname]);
    return;
  }

  this.client_provider(hostname, function(error, client){
    if(error){
      throw new Error(hostname + ' network client not found: ' + error);
    }

    self.clients[hostname] = client;

    callback(error, client);
  })
}

Gateway.prototype.httpproxy = function(req, res, bounce) {
  var self = this;
  var routing_table = this.website_routing_table;
  var stack_id = routing_table[req.headers.host];

  if(stack_id){

    /*
    
      get the network client for the stack hosting this website
      
    */
    self.ensure_client(stack_id, function(error, client){
      var webserver = client.webserver_details();

      bounce(webserver.host, webserver.port);
    })
  }
  else {
    res.statusCode = 404;
    res.end('no such host');
  }
}

/*

  this is the main proxy to requests

  the gateway client will have inserted the hostname into the muiltipart message

  this means we get away with not having to JSON.parse the message just to route it

  message parts:

    REQ

      SOCKET_ID

      CONNECTION_ID

      HOSTNAME

      PACKET

    REP

      SOCKET_ID

      CONNECTION_ID

      PACKET


  
*/
Gateway.prototype.rpcproxy = function(message_parts, callback){
  
  var hostname = message_parts.shift().toString();
  var packet = message_parts.shift().toString();

  this.ensure_client(hostname, function(error, client){
  
    var supply_chain = client.raw('/');

    supply_chain(packet, function(error, result){
      callback(result);
    });
  })

}

Gateway.prototype.bind = function(callback){
  var self = this;

  
  this.rpc = new ZMQRPC('gateway', this.ports);
  this.pubsub = new ZMQPubSub('gateway', this.ports);
  this.http = bouncy(_.bind(this.httpproxy, this));

  this.rpc.on('message', _.bind(this.rpcproxy, this));

  async.series([
    function(next){
      console.log('-------------------------------------------');
      console.log('Gateway RPC server listening: ');
      eyes.inspect(self.ports);
      next();
    },
    function(next){
      console.log('-------------------------------------------');
      console.log('booting RPC');
      self.rpc.bind(next);
    },
    function(next){
      console.log('-------------------------------------------');
      console.log('booting PUBSUB');
      self.pubsub.bind(next);
    },
    function(next){
      console.log('-------------------------------------------');
      console.log('booting HTTP');
      self.http.listen(self.ports.http);
      next();
    }
  ], callback);
  
}