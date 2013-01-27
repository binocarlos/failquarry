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