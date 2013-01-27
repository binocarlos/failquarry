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

module.exports = PubSub;


/*
  Quarry.io - Local - RPC
  -----------------------

  ZeroMQ server for warehouse RPC


 */

function PubSub(id, ports){
  Server.apply(this, [id, ports]);
}

/**
 * Inherits from `Server.prototype`.
 */

PubSub.prototype.__proto__ = Server.prototype;

PubSub.prototype.build_sockets = function(){
  var self = this;
  this.pub = this.add_socket('pub', this.ports.pub);
  this.sub = this.add_socket('sub', this.ports.sub);

  /*
  
    blanket listen so we can then broadcast
    
  */
  this.sub.subscribe('');

  this.sub.on('message', _.bind(this.pub.send, this.pub));
}

