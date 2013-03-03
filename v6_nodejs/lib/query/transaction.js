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
var eyes = require('eyes');
var queries = require('./factory');
var utils = require('../utils');
var EventEmitter = require('events').EventEmitter;
var Request = require('./request');
var Response = require('./response');


/*
  Quarry.io - Transaction
  -----------------------

  Looks after the combination of a REQ/REP loop and the feedback from the
  switchboard about that request

  It offers a rollback function to reverse the changes

  It also offers a confirm function which will merge in id's from the server

  The client changing the data will affect their local copy
  and register a rollback function

  The REQ/REP loop will tell the client whether or not to keep
  their changes



  

 */

module.exports = Transaction;

function Transaction(options){
  _.extend(this, EventEmitter.prototype);

  options || (options = {});
  this.options = options;

  this.id = utils.quarryid();

  this.container = options.container;
  this._ready_callbacks = [];

  this._shipping = false;
  this._completed = null;

  if(this.options.query_factory){
    this.query_factory = this.options.query_factory;
  }

  if(this.options.router){
    this.router = this.options.router;
  }

  if(this.options.filter){
    this.filter = this.options.filter;
  }

  // if this is not present then the error event will throw an
  // exception if there is no other listener
  this.on('error', function(){

  })
}

Transaction.prototype.filter = function(results){
  return results;
}

/*

  The function that generates the query we actually send to our supplychains

  The default is a full-on network stack POST to the reception server

  This can be replaced however with the context outside the transaction
  returning what-ever base level request to send

 */
Transaction.prototype.query_factory = function(){
  return new Request({
    method:'get'
  })
}

Transaction.prototype.debug = function(fn){
  var self = this;
  _.each(this.container.switchboards, function(switchboard){
    switchboard.listen('transaction:debug', self.id, function(message){
      fn && fn.apply(self, [message]);
    })
  })
  this.debugmode = true;
  
  return this;
}

Transaction.prototype.cleanup = function(){
  var self = this;
  _.each(this.container.switchboards, function(switchboard){
    switchboard.removeAll('transaction', self.id);
  })
  return this;
}

Transaction.prototype.complete = function(results){
  var self = this;
  self._shipping = false;
  self._completed = results;

  _.each(this._ready_callbacks, function(fn){
    fn(results);
  })
}

Transaction.prototype.each = function(fn){
  this.ship(function(results){
    if(results._is_quarry_container){
      results.each(fn);
    }
  })
}

Transaction.prototype.use = function(fn){
  fn && this._ready_callbacks.push(fn);
  return this;
}

Transaction.prototype.ship = function(fn){
  var self = this;

  if(this.container.count()<=0){
    fn && fn(this.filter([]));
    return;
  }

  if(this._completed){
    fn && fn(this._completed);
    return this;
  }
  else if(this._shipping){
    fn && this._ready_callbacks.push(fn);
    return this;
  }

  fn && this._ready_callbacks.push(fn);
  this._shipping = true;
  
  var req = this.query_factory();

  req.transactionid(this.id);
  this.debugmode && req.debugmode('broadcast');

  
  /*

    The reception transaction handler will return a multi-part response

    The indexes line up with the skeleton input

   */

  this.container.handle(req, function(mainres){

    var results = [];
    var errors = [];

    if(mainres.multipart()){

      _.each(mainres.multipartResponses(), function(multires){

        /*
        
          here we can emit commit and error events
          for each of the original containers in the input skeleton
          
         */

        if(multires.skeletonid()){
          var index_container = self.container.tagname()=='warehouse' ? self.container.eq(0) : self.container.byid(multires.skeletonid());

          if(!index_container){
            throw new Error('There is no transaction container: ' + multires.skeletonid());
          }

          if(multires.hasError()){
            self.emit('rollback', index_container, multires);
          }
          else{
            self.emit('commit', index_container, multires);
          }
          
        }
        
        if(multires.hasError()){
          self.emit('error', multires);
        }
        else{
          results = results.concat(multires.body() || []);
        }
      })
    }
    else{
      if(mainres.hasError()){
        self.emit('error', mainres);
      }
      else{
        results = mainres.body() || [];
      }
    }

    /*

      The final callback

     */
    self.emit('results', results);

    self.complete(self.filter(results));
  })

  return this;

}