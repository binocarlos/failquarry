/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/**
 * Module dependencies.
 */

var util = require('util');
var utils = require('../utils');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

module.exports = Message;

/*

  quarry.io - portal message

  the messages that arrive via a portal - hooked up with
  the targets and meta

  you pass the raw content of the message and a spawn
  function that will produce containers from data

  
*/

function Message(content, spawn){
  EventEmitter.call(this);

  _.extend(this, content || {});
  this.content = content;
  this.spawn = spawn;
}

util.inherits(Message, EventEmitter);

Message.prototype.get_containers = function(){
  var data = this.headers['content-type']=='quarry/containers' ? this.content.body : [];

  return this.spawn(data);
}

Message.prototype.get_target = function(){
  var data = this.target ? [{
    meta:this.target
  }] : [];

  return this.spawn(data);
}

Message.prototype.get_update = function(){
  var data = this.headers['content-type']=='quarry/update' ? data : [];

  return this.spawn(data);
}

Message.prototype.toJSON = function(){
  return this.content;
}