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
  Quarry.io - Router
  ------------------

  Looks at the hostname / protocol of packets

  


 */


/*
  Module dependencies.
*/

var _ = require('underscore');
var async = require('async');
var Warehouse = require('../warehouse');
var util = require("util");
var eyes = require('eyes');

module.exports = Router;

/*
  Create a new router that can build out to supply chains
  based on hostname
 */

module.exports.factory = function(config){


  // the warehouse wrapped supplier
  var router_warehouse = new Router(config);

  var self = router_warehouse;

  router_warehouse.use(function(packet, next){

    var route1 = packet.hostname();
    var route2 = packet.protocol() + '://' + packet.hostname();

    function found_route(fn){
      fn.apply(this, [packet, next]);
    }

    if(self._routes[route1]){
      found_route(self._routes[route1]);
    }
    else if(self._routes[route2]){
      found_route(self._routes[route2]);
    }
    else{
      next();
    }
  })

  return router_warehouse;
}

function Router(config){
  Warehouse.apply(this, [config]);
  this._routes = {};
}

util.inherits(Router, Warehouse);

Router.prototype.route = function(hostname, fn){
  this._routes[hostname] = fn;
  if(hostname.match(/:\/\//)){
    var parts = hostname.split(/:\/\//);
    this._routes[parts[1]] = fn;
  }
  return this;
}

