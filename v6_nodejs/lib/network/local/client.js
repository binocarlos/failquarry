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
var utils = require('../../utils');
var eyes = require('eyes');
var Base = require('../client');
var queries = require('../../query/factory');
var ZMQRPC = require('../zeromq/client/rpc');
var ZMQPubSub = require('../zeromq/client/pubsub');

module.exports = Base.extend({

  clients:{},

  get_allocation:function(path){
    var allocations = this.get('allocations');

    return allocations[path];
  },

  ensure_client:function(path, creator, callback){
    var self = this;
    if(self.clients[path]){
      callback(null, self.clients[path]);
      return;
    }

    creator(function(error, client){
      self.clients[path] = client;
      callback(null, self.clients[path]);
    })
  },

  run_request:function(path, req, res){
    var self = this;

    self.ensure_client(path, function(callback){

      var allocation = self.get_allocation(path);

      var client = new ZMQRPC(path, allocation.ports);

      client.connect();

      callback(null, client);

    }, function(error, client){
      if(error){
        res.sendError(error);
        return;
      }
      else{
        var message_parts = [JSON.stringify(req.toJSON())];

        client.request(message_parts, function(error, result){
          if(error){
            res.sendError(error);
          }
          
          res.set(JSON.parse(result));
          res.send();
        })
      }
    })
  },

  /*
    Produce a supply chain that points to a given node
   */
  rpc:function(path){

    var self = this;

    return function(req, res, next){

      self.run_request(path, req, res);
      
    }
    
    
  },

  raw:function(path){

    var self = this;

    return function(packet, callback){

      var req = queries.fromJSON(JSON.parse(packet));
      var res = queries.response(function(res){
        callback(null, JSON.stringify(res.toJSON()));
      })

      self.run_request(path, req, res);
    
    }
    
    
  }
})