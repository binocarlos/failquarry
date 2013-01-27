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
var Server = require('../server');

module.exports = RPC;


/*
  Quarry.io - Local - RPC
  -----------------------

  ZeroMQ server for warehouse RPC


 */

function RPC(id, ports){
  Server.apply(this, [id, ports]);
}

/**
 * Inherits from `Server.prototype`.
 */

RPC.prototype.__proto__ = Server.prototype;

RPC.prototype.build_sockets = function(){
  var self = this;
  this.rpc = this.add_socket('router', this.ports.rpc);
  this.rpc.on('message', function(){

    var message_parts = _.toArray(arguments);

    var socket_id = message_parts.shift().toString();
    var connection_id = message_parts.shift().toString();
  
    function request_callback(reply){
      var reply_message_parts = [socket_id, connection_id, reply];

      self.rpc.send.apply(self.rpc, [reply_message_parts]);
    }

    /*
    
      emit the arguments array (the parts of a multi-part message)

      we are still in Buffer mode (i.e. non-strings)
      
    */
    self.emit.apply(self, ['message', message_parts, request_callback]);
    
  })
}