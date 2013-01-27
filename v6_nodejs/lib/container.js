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
var Backbone = require('./vendor/backbone');
var Proto = require('./container/proto');
var eyes = require('eyes');

/*
  Quarry.io - Container
  ---------------------

  The main unit in the quarry.io stack

  A container provides a wrapper for a list of container base models

  Much like jQuery (which wraps DOM elements) - this wraps Backbone models

  Each base container has a supply chain & routing - it can stand alone

  

 */

exports = module.exports = factory;

/*

  Returns a factory function to create new containers

  This allows you to customize the container and model behaviour
  before they are instantiated

 */
function factory(options){
  options || (options = {});

  return function(){
    return Proto.factory(_.toArray(arguments), options);
  }
}

factory.new = function(){
  return Proto.factory(_.toArray(arguments));
}