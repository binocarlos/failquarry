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
var ZMQRPC = require('../../zeromq/server/rpc');
var Server = require('../server');
var queries = require('../../../query/factory');

module.exports = RPC;


/*
  Quarry.io - Local - PubSub
  -----------------------

  ZeroMQ server for warehouse PubSub


 */

function RPC(deployment){
  Server.apply(this, [deployment]);  
}

/**
 * Inherits from `Server.prototype`.
 */

RPC.prototype.__proto__ = Server.prototype;

RPC.prototype.build_zeromq = function(){
  this.zeromq = new ZMQRPC(this.deployment.processname(), this.ports);
}

RPC.prototype.build_worker = function(callback){
  var self = this;

  this.bootloader.rpc(function(error, warehouse){
    
    self.zeromq.on('message', function(packet, callback){

      var req = queries.fromJSON(JSON.parse(packet));
      var res = queries.response(function(res){
        callback(JSON.stringify(res.toJSON()));
      })

      warehouse.handle(req, res, function(){
        res.send404();
      })
    })

    callback();
  })
}
