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
  Quarry.io - Process Stack
  -------------------------

  Pass messages about in memory using plain old functions

  


 */


/*
  Module dependencies.
*/

var _ = require('underscore');
var async = require('async');
var util = require("util");
var eyes = require('eyes');
var Stack = require('../stack');

module.exports = Node;

function Node(config){
  Node.apply(this, [config]);
}

Node.prototype.initialize = function(options){
  
}

Node.prototype.boot = function(){
  
}

Node.prototype.req = function(packet, callback){
  
}