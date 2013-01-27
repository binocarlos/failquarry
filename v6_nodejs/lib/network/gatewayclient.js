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
var ZMQRPC = require('./zeromq/client/rpc');
var ZMQPubSub = require('./zeromq/client/pubsub');
var Switchboard = require('../switchboard/proto');

/*
  Quarry.io - Gateway
  -------------------

  The overall entry point for a network

  This will decide what stack to route to based on hostname (virtual hosting)


 */
module.exports = GatewayClient;
/*


  Constructor




 */

function GatewayClient(options){
  options || (options = {});
  this.ports = options.ports;
}

/*

  returns an object with 2 functions wrapped with hostname
  injections for the backend gateway server to route with
  
*/
GatewayClient.prototype.stack = function(hostname){
  var self = this;
  var switchboard = new Switchboard({
    routing_key:hostname,
    ports:this.ports
  })

  return {
    rpc:function(req, res, next){
      self.rpc_request(hostname, req, res);
    },
    
    switchboard:switchboard
  }
}

/*

  the bridge between quarry requests and ZeroMQ packets
  
*/
GatewayClient.prototype.rpc_request = function(hostname, req, res){
  var self = this;

  var message_parts = [hostname, JSON.stringify(req.toJSON())];

  self.rpc.request(message_parts, function(error, packet){

    res.assign_packet(packet);

    res.send();
  })

}

GatewayClient.prototype.connect = function(callback){
  var self = this;
  this.rpc = new ZMQRPC('gateway', this.ports);

  async.series([
    function(next){
      console.log('-------------------------------------------');
      console.log('Gateway RPC client connecting: ');
      eyes.inspect(self.ports);
      next();
    },
    function(next){
      console.log('-------------------------------------------');
      console.log('connecting RPC');
      self.rpc.connect(next);
    }
  ], callback);
  
}