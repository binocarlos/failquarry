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

