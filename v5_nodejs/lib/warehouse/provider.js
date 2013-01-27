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

