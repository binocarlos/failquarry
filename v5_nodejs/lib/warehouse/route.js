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
var eyes = require('eyes');

module.exports = Warehouse;

/*
  Quarry.io - Route
  ---------------------

  Combination of:

    protocol
    hostname
    path
    resource

 */

/*
  The warehouse itself is a function that triggers the middleware stack
 */
function Warehouse(options){
  _.extend(this, Backbone.Events);
  this.initialize(options);
}


/*
  To tell apart from containers in the container factory
 */
Warehouse.prototype.is_warehouse = true;

/*
  The normal default container model
 */
Warehouse.prototype.initialize = function(options){

  var self = this;

  options || (options = {});
  this.options = options;

  // our routes
  this._routes = {
    
  }

  // the Backbone models we use to produce containers
  this._models = {};

  // setup models from the options
  this.models(options.models);
}


/*
  

  Models


 */

/*
  The class we are using for our container models

  The container model is a base class that points into:

    attr model
    meta model
    data model
    children collection
 */

Warehouse.prototype.models = function(models){
  models || (models = {});
  this._models = _.extend(this._models, models);
  this.base_model = baseFactory(this._models);
  return this;
}

// assign the model we will use for the core attr
Warehouse.prototype.model = function(model){
  this.models({
    attr:model
  })
  return this;
}

// assign the model we will use for the meta
Warehouse.prototype.metamodel = function(model){
  this.models({
    meta:model
  })
  return this;
}

/*
  return a new MODEL
 */
Warehouse.prototype.model_factory = function(raw_data){

  // are we already a model?
  if(raw_data && raw_data._is_container_model){
    return raw_data;
  }

  return new this.base_model(raw_data);
}

/*
  

  Container Factory


 */

/*
  return a new CONTAINER
 */
Warehouse.prototype.new = function(){


  var args = _.toArray(arguments).concat(this);

  // create false data with the warehouse on the end
  if(args.length<=1){
    args = [{
      _meta:{}
    }, args[0]]
  }

  return Container.apply(null, args);
}


/*


  STACK





 */

Warehouse.prototype.find_route = function(packet){

}

Warehouse.prototype.run = function(packet, next){
  var routing_key = [packet.protocol(), packet.path()].join('.');
  var route = this._routes[routing_key];
  if(route){
    route(packet, next);
  }
  else{
    next && next();
  }
}

Warehouse.prototype.use = function(fn){
  if(arguments.length<=2){
    fn = path;
    path = protocol;
    protocol = 'quarry';
  }

  this._routes[protocol + '.' + path] = fn;

  return this;
}



/*
  Are we running in the browser?
 */
Warehouse.prototype.serverside = typeof window === 'undefined';