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