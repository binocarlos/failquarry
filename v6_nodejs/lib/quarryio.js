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