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

var baseFactory = require('./container/base');
var Promise = require('./container/promise');
var searcher = require('./container/search');
var helpers = require('./container/helpers');
var xml = require('./container/xml');
var _ = require('underscore');
var async = require('async');
var utils = require('./utils');

var eyes = require('eyes');

/*
  Quarry.io - Container
  ---------------------

  The main unit in the quarry.io stack

  A container provides a wrapper for a list of container base models

  Much like jQuery (which wraps DOM elements) - this wraps Backbone models

  Each base container has a supply chain & routing - it can stand alone

  

 */

module.exports = factory;

// the base model used if there is no warehouse or overrides
var default_base_model = baseFactory();

/*
  The prototype that wraps an array of container backbone models and proxies
  the functions down to the individual models (just like jquery)
 */

var Mixin = {

  /*
    the array of underlying JSON data for container models
   */
  models:[],

  /*
    Lets us tell the difference between containers and supply chains
   */
  is_container:true,

  /*
    
   */
  _warehouse:null,

  /*



    Constructor



  */

  new:function(){

    var args = _.toArray(arguments).concat(this._warehouse);

    return factory.apply(null, args);
  },


  /*
    Get/set the warehouse used by this container
   */
  warehouse: function(){
    return arguments[0]!=null ? this._warehouse = arguments[0] : this._warehouse;
  },

  


  /*


    Events - we register our events on the warehouse so they are global
    this means that events from the backend warehouses will trigger these too : )

  

  bind: function(event, callback){
    var self = this;
    console.log('BINDING');
    this.each(function(container){
      console.log('-------------------------------------------');
      console.log(container._warehouse);
      container._warehouse && container._warehouse.bind(container.quarryid(), event, callback);
    })
    return this;
  },

  trigger: function(){
    var self = this;
    var args = _.toArray(arguments);
    this.each(function(container){
      container._warehouse && container._warehouse.trigger.apply(container._warehouse, [container.quarryid()].concat(args));
    })
    return this;
  },

  unbind: function(event, callback){
    var self = this;
    this.each(function(container){
      container._warehouse &&  container._warehouse.unbind(container.quarryid(), event, callback);
    })
    return this;
  },

  unbind_all: function(){
    var self = this;
    this.each(function(container){
      container._warehouse &&  container._warehouse.unbind_all(container.quarryid());
    })
    return this;
  },
*/ 

  /*



    Save



  */

  save:function(callback){

    var self = this;

    var promise = self.promise({
      answer_filter:function(response){
        return response;
      }
    })

    promise.save(this);

    callback && promise.ship(callback);

    return promise;
   
  },

  /*



    Delete



  */

  delete:function(callback){

    var self = this;

    var promise = self.promise({
      answer_filter:function(response){
        return response;
      }
    })

    promise.delete(this);

    callback && promise.ship(callback);

    return promise;
   
  },

  /*



    Append



  */

  /*

    concat to the current level of models - NO SERVER HIT this is just for organising containers
    not appending models

   */

  pourInto:function(target){
    this.addTo(target);
    return this;
  },

  add:function(child){
    var self = this;
    _.each(child.models, function(add_model){
      self.models.push(add_model);
    })
    
    return this;
  },

  addTo:function(parent){
    parent.add(this);
    return this;
  },

  /*

    Append to the children level of models

    Network mode means we return a promise and pipe the append packet to the warehouse

    Non-network mode just appends the models in-memory and leaves the warehouse alone

   */
  append:function(child, network_mode){

    var self = this;

    if(arguments.length<=0 || this.models.length<=0){

      if(network_mode){
        var promise = new Promise();

        promise
          .loader(function(){
            promise.keep();
          })

        return promise;
      }
      else{
        return this;  
      }
      
    }

    if(!_.isArray(child)){
      child = [child];
    }

    var cloned_children = _.map(child, function(c){
      return c.clone();
    })

    if(network_mode){

      var raw_append_data = [];

      _.each(cloned_children, function(cloned_child){
        raw_append_data = raw_append_data.concat(cloned_child.toJSON());
      })

      function rollback(){
        _.each(this.models, function(model){

          model.detatch(cloned_children.models);

        })
      }

      var promise = self.promise({
        answer_filter:function(response){

          return response;
        }
      })

      promise.append(raw_append_data);

      if(_.isFunction(network_mode)){
        promise.ship(network_mode);
      }

      return promise;
    }
    else{

      _.each(this.models, function(model){

        _.each(cloned_children, function(cloned_child){
          model.append(cloned_child.models);
          
        })

      })

      return this;
    }
  },

  appendTo:function(parent){
    parent.append(this);
    return this;
  },

  /*



    Merge



  */  




  /*



    Find - this is an in-memory sync fake version of the backend warehouse
    search - the RAM supplier delegates it's select packets to here

  */

  find:function(){

    // use the search library to perform the reduction
    return searcher(this, _.toArray(arguments));
  },


  /*



    Factory workers

  */


  /*
    Create containers using the same warehouse as this one
   */
  spawn: function(models){
    if(!_.isArray(models)){
      models = _.isUndefined(models) ? [] : [models];
    }
    return factory(models, this._warehouse);
  },

  /*
    Turn the array of models into an array of stand-alone containers
   */
  containers: function(){
    var self = this;
    return _.map(this.models, function(model){
      return self.spawn(model);
    })
  },

  /*
    Merge all the children containers into a new one
   */
  children: function(){
    var self = this;
    var ret = [];
    
    _.each(this.models, function(model){
      ret = ret.concat(model.children());
    })

    return factory(ret, this._warehouse);
  },

  childcontainers: function(){
    var self = this;
    return _.map(this.children().models, function(model){
      return self.spawn(model);
    })
  },

  /*
    Recursviely merge all the children into a new container
   */
  descendents: function(){

    var ret = [];

    function add_model(model){
      ret.push(model);

      _.each(model._children, add_model);
    }

    _.each(this.models, add_model);

    return factory(ret, this._warehouse);
  },

  /*
    Run a function over all descendents
   */
  recurse: function(fn){
    this.descendents().each(fn);
  },

  /*
    The parents are assigned by the children function inside the model
   */
  parent: function(){
    var self = this;
    var ret = [];
    
    _.each(this.models, function(model){
      model.parent && model.parent() ? ret.push(model.parent()) : null;
    })

    return factory(ret, this._warehouse);
  },

  /*



    Model Accessors



  */

  // access the base model at position x
  get:function(at){
    return this.models[at];
  },

  // access the attributes
  model:function(at){
    var model = this.get(at);

    return model._attr;
  },

  first:function(){
    return this.eq(0);
  },

  last:function(){
    return this.eq(this.count()-1);
  },

  count:function(){
    return this.models.length;
  },

  eq:function(at){
    return this.spawn(this.get(at));
  },


  /*



    Data Accessors



  */  

  /*
    Deep copy of the data with quarryid and routing stripped out and with no warehouse
   */
  clone:function(){

    function strip(raw_data){
      raw_data._meta || (raw_data._meta = {});

      delete(raw_data._meta.quarryid);
      delete(raw_data._meta.route);

      raw_data._children = _.map(raw_data._children, strip);

      return raw_data;
    }

    // first make a true copy of the data
    var data = _.map(JSON.parse(JSON.stringify(this.toJSON())), strip);

    return factory(data);
  },

  toJSON:function(){
    return _.map(this.models, function(model){
      return model.toJSON();
    })
  },

  toXML:function(){
    return xml.toXML(this.toJSON());
  },

  // convert to XML without the children
  simpleXML:function(){
    return xml.toXML(_.map(this.toJSON(), function(data){
      var ret = _.extend({}, data);
      delete(ret._children);
      return ret;
    }));
  },

  /*



    Attribute getter/setters



  */

  /*
    base ATTR accessor
   */
  attr:helpers.wrapper({
    singular:'attr'
  }),

  /*
    base META accessor
   */
  meta:helpers.wrapper({
    singular:'meta'
  }),

  /*
    base DATA accessor
   */
  data:helpers.wrapper({
    singular:'data'
  }),

  /*
    Delete attributes
   */
  removeAttr:helpers.wrapper({
    all:true,
    singular:'removeAttr'
  }),



  /*
    Quarryid accessor
   */
  quarryid:helpers.wrapper({
    property:true,
    singular:'quarryid'
  }),

  /*
    id accessor
   */
  id:helpers.wrapper({
    property:true,
    singular:'id'
  }),  

  /*
    Tagname accessor
   */
  tagname:helpers.wrapper({
    property:true,
    singular:'tagname'
  }),


  /*
    classnames
   */
  classnames:helpers.wrapper({
    property:true,
    singular:'classnames'
  }),

  /*
    route accessor
   */

  route:helpers.wrapper({
    singular:'route'
  }),

  hostname:helpers.wrapper({
    property:true,
    singular:'hostname'
  }),

  protocol:helpers.wrapper({
    property:true,
    singular:'protocol'
  }),

  resource:helpers.wrapper({
    property:true,
    singular:'resource'
  }),

  classname_map:helpers.wrapper({
    first:true,
    singular:'classname_map'
  }),

  addClass:helpers.wrapper({
    all:true,
    singular:'addClass'
  }),

  removeClass:helpers.wrapper({
    all:true,
    singular:'removeClass'
  }),

  hasClass:helpers.wrapper({
    first:true,
    singular:'hasClass'
  }),

  /*
    Summary accessor
   */
  summary:function(){
    return this.simpleXML().replace(/ quarryid=".*?"/, '').replace(/\n$/, '');
  },

  /*
    Are we the root level warehouse (so we never include routing?)
   */
  is_warehouse:function(){
    return this.quarryid()=='warehouse';
  },

  /*
    We are saved if our quarryid has a full GUID (including dashes)
   */
  is_saved: function(){
    return this.quarryid() && this.quarryid().match(/-/);
  },

  ensure_ids: function(){
    this.recurse(function(container){
      if(!container.is_saved()){
        container.quarryid(utils.quarryid());
      }
    })
    return this;
  }
}

// we can use either event model
Mixin.on = Mixin.bind;
Mixin.emit = Mixin.trigger;

function map_factory(underscore_method){

}

/*
  These are underscore methods that returns the original container
 */
var chain_methods = [
  'each',
  'forEach',
  'invoke'
]

/*
  These are underscore methods that return a direct primitive value
 */

var direct_methods = [

  'map',
  'all',
  'every',
  'some',
  'any',
  'contains',
  'include'


]

/*
  These are underscore methods that will return a reduced container set
 */
var map_methods = [
  
  'reduce',
  'reduceRight',
  'detect',
  'filter',
  'select',
  'reject',
  'max',
  'min',
  'sortBy'
]

_.each(chain_methods, function(chain_method){
  Mixin[chain_method] = function(){
    var self = this;
    _[chain_method].apply(_, [self.containers()].concat(_.toArray(arguments)));
    return this;
  }
})

_.each(direct_methods, function(direct_method){
  Mixin[direct_method] = function(){
    var self = this;
    return _[direct_method].apply(_, [self.containers()].concat(_.toArray(arguments)));
  }
})

_.each(map_methods, function(map_method){
  Mixin[map_method] = function(){

    var self = this;

    // this becomes an array of containers
    var mapped_results = _[map_method].apply(_, [self.containers()].concat(_.toArray(arguments)));

    var mapped_models = _.map(mapped_results, function(mapped_result){
      return mapped_result.get(0);
    })

    return factory(mapped_models, self._warehouse);
  }
})


/*
  The container factory - this creates new containers with the given warehouse
 */
function factory(){

  var args = _.toArray(arguments);

  var warehouse = null;
  var single_data = {};
  var model_data = null;

  function processarg(arg){

    if(_.isArray(arg)){
      model_data = arg;
    }
    else if(_.isString(arg)){
      // XML string
      if(arg.match(/^\s*</)){
        model_data = xml.fromXML(arg);
      }
      // JSON string
      else if(arg.match(/^[\[\{]/)){
        model_data = JSON.parse(arg);
      }
      else{
        single_data = utils.extend(true, single_data, {
          '_meta':{
            'tagname':arg
          }
        })
      }
    }
    else if(_.isObject(arg)){
      if(arg.is_warehouse){
        warehouse = arg;
      }
      else{
        single_data = arg;
      }
    }
  }

  // insert a blank one as a constructor
  if(args.length<=0){
    model_data = [{}]
  }
  else if(args.length==1){
    processarg(args[0]);
  }
  else{
    processarg(args[0]);
    processarg(args[1]);
  }

  if(model_data==null){
    model_data = [single_data];
  }

  if(!_.isArray(model_data)){
    model_data = [model_data];
  }

  function strip_nulls(route){
    return route!=null;
  }

  function extract_skeleton(raw_model){
    return JSON.parse(JSON.stringify({
      '_route':raw_model.route(),
      '_meta':raw_model.meta()
    }));
  }

  function model_factory(raw_data){

    if(raw_data && raw_data._is_container_model){
      return raw_data;
    }

    return warehouse && _.isFunction(warehouse.model_factory) ? warehouse.model_factory.apply(warehouse, [raw_data]) : new default_base_model(raw_data);
  }


  function make_results_container(raw_results){
    return factory(raw_results, warehouse);
  }

  // turns raw container data into containers after /select packets
  function default_answer_filter(response){
    /*
      This is the standard 'make containers' filter


     */
    var container_data = response.res.body() || [];

    if(!_.isArray(container_data)){
      if(_.isObject(container_data)){

        container_data = [container_data];  
        
      }
      else{
        container_data = [{
          data:container_data
        }]
      }
    }
    else{

    }

    return make_results_container(container_data);
  }


  /*
    The pointer to this array is passed all through container
    Change this array and the container's contents is changed

   */
  var models = _.map(model_data, model_factory);


  /*
    Whenever we communicate with the warehouse the packet routes via here

    The promise is what is returned the 'ship' method of it will trigger the network

    This pattern means the user can build up query params before the request is sent


   */
  function promise_factory(options){

    options || (options = {});

    var answer_filter = options.answer_filter;
    var rollback = options.rollback;

    /*
      The answer filter is what takes raw results back and decides
      what to pass to the promise.keep

     */
    answer_filter || (answer_filter = default_answer_filter);

    /*
      rollback is the function to run if the answer has any kind of error

     */
    rollback || (rollback = function(){

    })

    // what we pass as the basis of input for the branch
    var skeleton = _.filter(_.map(models, extract_skeleton), strip_nulls);

    // add each of the arguments onto a backwards pipe
    // this enables endless context switching
    var promise = new Promise(skeleton, warehouse);

    // setup the promise with a route to us for actually loading the data
    promise
      .loader(function(packet){

        /*
          With no warehouse we can't do much - pupe back an array!
         */
        if(!warehouse){
          packet.res.body([]);
          promise.keep(answer_filter(packet));
          return;
        }

        /*

            Our exit point for packets going to the warehouse

         */

        // run the warehouse proper
        warehouse.run(packet, function(response){
          
          /*
            The entry point for packets coming back from the warehouse


           */
          if(response.hasError()){
            rollback && rollback();
            promise.failed(response.error());
          }
          else{
            // we now have the answer packet - res.body should be the raw data for our containers

            promise.keep(answer_filter(response));
          }

        })
      })

    return promise;
  }

  /*
    The actual object we will return
   */
  function container(){
    var self = this;

    // get the promise with the standard container filter

    // TODO - this is where to have filters for the warehouse output happening
    var promise = promise_factory();
    
    // add the selector sequence to the promise
    promise.selector_sequence(_.toArray(arguments));
    
    return promise;
  }

  _.extend(container, Mixin);
  container.models = models;
  container.warehouse(warehouse);

  /*
    We map this here because all the functions to do it are just above

   */
  container.get_skeleton = function(){
    return _.filter(_.map(models, extract_skeleton), strip_nulls);
  }

  /*

    Make and return a promise for non-select packets (like append, delete etc)

   */
  container.promise = function(options){
    return promise_factory(options);
  }

  container.select = container;

  return container;  
}