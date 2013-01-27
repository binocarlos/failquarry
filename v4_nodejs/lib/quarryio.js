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

var EventEmitter = require('events').EventEmitter
  , path = require('path')
  , basename = path.basename
  , _ = require('underscore')
  , fs = require('fs');

/*
  Quarry.io
  ---------

  The main entry function for the quarry.io library


 */

/***********************************************************************************
 ***********************************************************************************
  


 */

exports.version = '0.0.1';



/*
  expose a new container constructor function
 */
exports.container = require('./container');


// alias
exports.new = function(){
  var ret = exports.container.apply(null, _.toArray(arguments));

  ret.data('new', true);

  return ret;
}

/*
  expose batch (wrapper for async)
 */
exports.batch = require('./batch');

exports.utils = require('./utils');

exports.webserver = require('./clients/express');


exports.document_root = __dirname;

/*
  the global map of supply chains by their domain
 */
var supply_chains = {};

/*
  the root level db
 */
exports.boot = function(supply_chain){

  // we pass root so selectors do not pass previous ids down the chain
  var root = exports.container(supply_chain);

  // flag the top level as a warehouse
  root.quarryid('root');

  return root;
}

exports.supplier = exports.boot;

/*
  expose the suppliers to the public API
 */

fs.readdirSync(__dirname + '/supply_chain').forEach(function(filename){
  if (!/\.js$/.test(filename)) return;
  var name = basename(filename, '.js');
  function load(){ return require('./supply_chain/' + name); }
  module.exports.__defineGetter__(name, load);
})



