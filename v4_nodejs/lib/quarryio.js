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



