/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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

