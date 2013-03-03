/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Quarry.io - Provider
  --------------------

  Gateway for warehouses with one type

  An XML file provider points to a directory

  A QuarryDB provider load-balances MONGO servers and points to collections 
  on the right server

  A Filesystem provider looks after the location of actual files and routes there

  etc

  


 */


/*
  Module dependencies.
*/

var _ = require('underscore');
var async = require('async');
var Warehouse = require('../warehouse');
var selectorParser = require('../container/selector');
var packetFactory = require('../packet');
var util = require("util");
var eyes = require('eyes');

module.exports = Provider;

/*
  Create a new router that can build out to supply chains
  based on hostname
 */

module.exports.factory = function(config){


  // the warehouse wrapped supplier
  var provider_warehouse = new Provider(config);

  provider_warehouse.use(function(packet, next){
    provider_warehouse.ensure_supplychain(packet.resource(), function(supplychain){
      supplychain.apply(provider_warehouse, [packet, next]);
    })
  })

  return provider_warehouse;
}

function Provider(config){
  Warehouse.apply(this, [config]);
  this._suppliers = {};
}

util.inherits(Provider, Warehouse);

Provider.prototype.ensure_supplychain = function(resource, callback){

  var self = this;

  function found_supplier(supplier){
    self._suppliers[resource] = supplier;
    supplier.ready(function(){
      callback(supplier);
    })
  }

  this._suppliers[resource] && found_supplier(this._suppliers[resource]);

  if(!this._factory){
    return;
  }

  var supplychain = this._factory.apply(this, [resource]);

  supplychain && found_supplier(supplychain);

  return this;
}

Provider.prototype.produce = function(fn){
  this._factory = fn;
  return this;
}

