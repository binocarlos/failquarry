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
var Proto = require('./proto');

module.exports = Client;


/*
  Quarry.io - Local - PubSub
  -----------------------

  ZeroMQ server for warehouse PubSub


 */

function Client(id, ports){
  Proto.apply(this, [id, ports]);
}

Client.prototype.__proto__ = Proto.prototype;

Client.prototype.is_client = true;

Client.prototype.connect = function(callback){

  /*
  
    this is done before to give us a chance to bind event handlers before we
    get any messages
    
  */
  this.emit('connect');

  _.each(this.sockets, function(socket){
    socket.connect();
  })
  
  callback && callback();
}
