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