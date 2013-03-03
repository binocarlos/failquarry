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
var packetFactory = require('../packet');
var eyes = require('eyes');

module.exports = Promise;

/*
  Quarry.io - Promise
  -------------------

  The promise that is returned by running a container selector


 */

function Promise(skeleton, warehouse){
  this._skeleton = skeleton;
  this._warehouse = warehouse;
  this._packet = packetFactory();
  this._loader = null;
  this._errorhandler = null;
  this._callback_stack = [];
}

/*
  give the promise the function it needs to actually load data

  the loader expects:

    contract_json, callback
 */
Promise.prototype.loader = function(loader_function){
  this._loader = loader_function;
  return this;
}

/*
  add onto the callback for when we are loaded
 */
Promise.prototype.use = function(callback_function){
  callback_function && this._callback_stack.push(callback_function);
  return this;
}

/*
  The trigger method - this is called at the end of the
  building up the contract chain
 */
Promise.prototype.ship = function(callback){
  if(!this._loader){
    throw new Error('there is a promise with no loader!')
  }
  callback && this.use(callback);
  this._loader.apply(this, [this._packet]);
  return this;
}

/*
  Register the callback function if the promise fails
 */
Promise.prototype.error = function(callback){
  this._errorhandler = callback;
  return this;
}

/*
  This means the packet has an error
 */
Promise.prototype.failed = function(error){
  this._errorhandler && _errorhandler.apply(this, [error]);
  return this;
}

Promise.prototype.each = function(callback){
  if(!this._loader){
    throw new Error('there is a promise with no loader!')
  }
  this.ship(function(results){
    results.each(callback);
  })
  return this;
}

/*
  The results are back and there is a container for us
 */
Promise.prototype.keep = function(container){
  var self = this;
  _.each(this._callback_stack, function(callback_function){
    callback_function && callback_function.apply(self, [container]);
  })
  this._callback_stack = [];
  return this;
}


/*
  add an array of selectors to the contract in a pipe config
 */
Promise.prototype.pipe = function(packet){
  this._packet.pipe(arr);
  return this;
}

/*
  merge the results from these selectors into the final results
 */
Promise.prototype.merge = function(packet){
  this._packet.merge(arr);
  return this;
}

/*
  merge the results from these selectors into the final results
 */
Promise.prototype.branch = function(packet){
  this._packet.branch(selector);
  return this;
}

Promise.prototype.delete = function(containers){
  var self = this;

  containers.each(function(delete_container){
    var model = delete_container.get(0);

    var delete_packet = packetFactory();
    delete_packet.route(model.route());
    delete_packet.protocol('quarry');
    delete_packet.path('/delete');
    delete_packet.req.param('input', delete_container.get_skeleton());

    self._packet.merge(delete_packet)
  })
  
  return this;
}

Promise.prototype.save = function(containers){
  var self = this;

  containers.each(function(save_container){
    var model = save_container.get(0);

    var data = model.toJSON();
    delete(data._children);
    var save_packet = packetFactory();
    save_packet.route(model.route());
    save_packet.protocol('quarry');
    save_packet.path('/save');
    save_packet.req.body(data);
    save_packet.req.param('input', save_container.get_skeleton());

    self._packet.merge(save_packet)
  })
  
  return this;
}

Promise.prototype.append = function(append_data){
  var self = this;
  var append_packet = packetFactory();

  append_packet.protocol('quarry');
  append_packet.path('/append');
  append_packet.req.body(append_data);

  this._packet.branch(append_packet);

  this._packet.req.param('input', self._skeleton);
  
  return this;
}

Promise.prototype.selector_sequence = function(selectors){

  var self = this;

  selectors = selectors.reverse();

  _.each(selectors, function(selector){
    self.selector(selector);
  })

  this._packet.req.param('input', self._skeleton);
  
  return this;
}

Promise.prototype.selector = function(selector_string){

  var select_packet = packetFactory();

  select_packet.protocol('quarry');
  select_packet.path('/selector');
  select_packet.req.body(selector_string);

  this._packet.branch(select_packet);
  
  return this;
}