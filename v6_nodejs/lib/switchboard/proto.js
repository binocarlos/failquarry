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
var ZMQPubSub = require('../network/zeromq/client/pubsub');

//var Proto = require('./proto');

module.exports = Switchboard;

function Switchboard(options){
  var self = this;
  options || (options = {});

  this.ports = options.ports;
  this.routing_key = options.routing_key;

  this.pubsub = new ZMQPubSub('gateway', this.ports);
  this.pubsub.connect();

  /*
  
    proxy the following methods into the pubsub client

    we prepend our routingkey to the channel each time
    
  */
  _.each(['broadcast', 'listen', 'remove', 'removeAll'], function(fn_name){
    self[fn_name] = function(){

      var args = _.toArray(arguments);

      args[0] = [self.routing_key, args[0]].join('.');

      self.pubsub[fn_name].apply(self.pubsub, args);
    }
  })
}