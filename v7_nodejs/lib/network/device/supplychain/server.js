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
var Contract = require('../../../contract');
var Device = require('../../device');
module.exports = factory;
/*
  Quarry.io - SupplyChain Server
  ------------------------------
 

 */

function factory(options, callback){

  options || (options = {});
  options.name || (options.name = 'supplychain_server');

  var stackid = options.stackid;

  if(!options.switchboard){
    throw new Error('the supplychain server wants a switchboard');
  }

  if(!options.stackid){
    throw new Error('the supplychain server wants a stackid');
  }

  if(!options.socket){
    throw new Error('the supplychain server wants a socket');
  }

  if(!options.socket.jsonmessage){
    throw new Error('the supplychain server wants a JSON socket');
  }

  var socket = options.socket;
  var switchboard = options.switchboard;

  var warehouse = Warehouse();
  warehouse.switchboard = switchboard;

  socket.on('jsonmessage', function(routingpacket, payload, callback){
    /*
    
      trigger the supply chain handler here
      
    */

    var req = Contract.request(payload);
    var res = Contract.response(function(){
      callback(res.toJSON());
    })

    process.nextTick(function(){
      warehouse(req, res, function(){
        res.send404();
      })  
    })
    
  })
  
  return warehouse;
}