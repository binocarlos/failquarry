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

var Warehouse = require('./warehouse');
var Container = require('./container');

var Supplier = require('./supplier');
var reception = require('./reception');
var provider = require('./provider');
var Switchboard = require('./switchboard');

var Network = require('./network');
var Stack = require('./stack');

var BackboneDeep = require('./vendor/backbonedeep');
var _ = require('underscore');

/*
  Quarry.io
  ---------

  This is the generic entry point


 */

var io = {

  version:'0.0.1'

}

require('console-trace')({
  always: true,
  right: true,
  colors: {
    warn: '35',
    info: '32'
  }
})

module.exports = io;

/*
  generates a warehouse which can reduce contracts and route packets
 */
io.warehouse = function(options){

  return Warehouse(options);

}

var container_factory = Container();

/*
  create a new container with no warehouse
 */
io.new = function(){
  var args = _.toArray(arguments);

  // from this level blank arguments is a new constructor
  if(args.length<=0){
    args = [{
      meta:{},
      attr:{},
      children:[]
    }]
  }

  return container_factory.apply(null, args);
}

/*
  create a new backbone model for the attr
  extends the deep model using the user supplied object
 */
io.model = function(obj){
  return BackboneDeep.extend(obj);
}

io.supplier = Supplier;
io.provider = provider;
io.reception = reception;
io.switchboard = Switchboard;
io.network = Network.server;
io.stack = Stack;