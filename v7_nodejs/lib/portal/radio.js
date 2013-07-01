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

var _ = require('lodash');
var util = require('util');
var utils = require('../utils');
var EventEmitter = require('events').EventEmitter;
var Message = require('./message');

module.exports = Radio;

/*

  quarry.io - radio

  a radio is a way of sending messages amoungst containers
  that are not HTTP methods on the supplier but transient
  events - perfect for real-time comms

  a server-side container supplier can listen to their own
  radios and decide to save the data if they want

  in fact - how server-side containers (i.e. suppliers) deal
  with radio messages is up to the events hash of the container

  (^^^ this is how the bots work)

  
*/

function Radio(portal){
  EventEmitter.call(this);

  /*
  
    a register a portal routes against callbacks
    
  */
  this.portal = portal;
}

util.inherits(Radio, EventEmitter);

Radio.prototype._router = function(routingkey){
  var parts = [this.portal.router.shallow()];

  if(routingkey){
    parts.push(routingkey);
  }

  return parts.join('.');
}

Radio.prototype.close = function(){
  this.portal.close();
  return this;
}

/*

  listen in on container events
  
*/
Radio.prototype.listen = function(routingkey, fn){

  var self = this;
  if(!fn){
    fn = routingkey;
    routingkey = '';
  }

  if(_.isFunction(fn)){
    if(routingkey!=''){
      var origfn = fn;
      fn = function(message){
        origfn(message.data);
      }
    }
    else{
      var origfn = fn;
      fn = function(message){
        origfn(message.data, message.route);
      } 
    }
    this.portal._prependlisten('radio:/', this._router(routingkey), fn);
  }
  else if(_.isObject(fn)){
    _.each(fn, function(f, routingkey){
      self.listen(routingkey, f);
    })
  }

  return this;  
}

Radio.prototype.listenonce = function(routingkey, fn){
  var self = this;
  if(!fn){
    fn = routingkey;
    routingkey = '';
  }

  var oldfn = fn;
  fn = function(){
    oldfn.apply(oldfn, _.toArray(arguments));
    self.portal._cancel(routingkey, fn);
  }
  self.listen(routingkey, fn);
  return this;
}

/*

  speak something
  
*/
Radio.prototype.talk = function(routingkey, data){

  if(!data){
    data = routingkey;
    routingkey = '';
  }

  this.portal._prependbroadcast('radio:/', this._router(routingkey), {
    route:routingkey,
    data:data
  })

  return this;
}