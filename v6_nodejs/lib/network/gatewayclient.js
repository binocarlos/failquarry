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