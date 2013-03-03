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