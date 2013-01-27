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
var utils = require('../utils');
var eyes = require('eyes');

/*
  Quarry.io - Query Router
  ------------------------

  Takes a query and a set of routes and produces
  the route we should direct the query to

 */
var skeleton = module.exports.skeleton = function(skeleton, method){
  skeleton = _.clone(skeleton);
  var routes = skeleton.routes;
  // this means the container is pointing somewhere else
  if(routes[method] || routes.all){

    // this flag means the id is invalidated
    skeleton.routed = true;
    skeleton.routed_id = skeleton.id;
    delete(skeleton.id);
  }

  skeleton.route = routes[method] || routes.all || routes.stamp;
  return skeleton;
}

var branch = module.exports.branch = function(skeleton, method){
  skeleton || (skeleton = {});
  var routes = skeleton.routes || {};
  // this means the container is pointing somewhere else
  return routes[method] || routes.all;
}

var frequency = module.exports.frequency = function(skeleton, method){
  var ret = route(skeleton, method);
  return ret.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '.');
}