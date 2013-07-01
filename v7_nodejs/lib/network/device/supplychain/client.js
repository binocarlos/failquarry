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

var _ = require('lodash');
var async = require('async');
var eyes = require('eyes');
var util = require('util');
var utils = require('../../../utils');
var EventEmitter = require('events').EventEmitter;
var Warehouse = require('../../../warehouse');
var Container = require('../../../container');
var Device = require('../../device');

module.exports = factory;

/*
  Quarry.io - SupplyChain Server
  ------------------------------
 

 */

function factory(options){

  options || (options = {});
  options.name || (options.name = 'supplychain_client');

  if(!options.switchboard){
    throw new Error('the supplychain client wants a switchboard');
  }

  if(!options.socket){
    throw new Error('the supplychain client wants a socket');
  }

  if(!options.socket.jsonsend){
    throw new Error('the supplychain client wants a JSON socket');
  }

  var socket = options.socket;
  var switchboard = options.switchboard;

  function supplychain(req, res, next){
    supplychain.emit('req', req);
    req.setHeader('x-quarry-stackid', options.stackid);
    socket.jsonsend(req.routingpacket(), req.toJSON(), function(answer){
      res.fill(answer);
    })
  }

  supplychain.rpc = function(routing_packet, request, callback){
    supplychain.emit('request', request);
    request.headers["x-quarry-stackid"] = options.stackid;
    socket.jsonsend(routing_packet, request, callback);
  }

  supplychain.switchboard = switchboard;

  supplychain.connect = function(stackpath){

    return Container.connect(supplychain, stackpath);
    
  }

  _.extend(supplychain, EventEmitter.prototype);
  return supplychain;
}