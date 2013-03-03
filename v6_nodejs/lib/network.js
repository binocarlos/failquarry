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
var utils = require('./utils');
var eyes = require('eyes');
var path = require('path');
var basename = path.basename;

var fs = require('fs');

module.exports.server = server_factory;
module.exports.client = client_factory;

/*
  Quarry.io - Network
  -------------------

  The network instance is always run on the quarry.io masters for a given network

  Looks after the co-ordination of a stacks processes onto actual servers

  The deployment looks after the physical resources in a quarry.io network

  It manages multiple stacks running on those resources

  The jobs of the deployment

  a) create & destroy physical compute instances
  b) bootload stack processes onto those compute instances
  c) create a supply chain network pointing to the stack processes
  d) provide the stack with the supply chain connections it needs for each processes



 */


/*

  Returns a factory function to create new containers

  This allows you to customize the container and model behaviour
  before they are instantiated

 */

function factory(type, code, options){
  type || (type = 'development');
  options || (options = {});

  options.type = type;

  var Class = require('./network/' + type + '/' + code);

  return new Class(options);
}

function server_factory(type, options){

  return factory(type, 'network', options);

}

function client_factory(type, options){

  return factory(type, 'client', options);

}