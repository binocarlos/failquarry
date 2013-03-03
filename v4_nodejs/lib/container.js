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
var events = require('eventemitter2');
var utils = require('./utils');
var selector_parser = require('./selector');
var blueprint = require('./blueprint');
var pigeonhole = require('./pigeonhole');
var templates = require('./templates');

var EventEmitter = events.EventEmitter2;
    
/*
  Quarry.io Container
  -------------------

  Gives a standard container for raw JSON data returned by suppliers

  This is the base wrapper class for all QuarryDB data throughout the system

 */



/***********************************************************************************
 ***********************************************************************************
  Here is the  data structure:

  {
    
    name:"Bob",
    price:100,

    // the meta data storage
    _meta:{
      id:'bob',
      tagname:'product',
      classnames:{
        red:true,
        blue:true
      }
    },

    // the array of child container values
    _children:[

      {...} // a raw container

      OR

      [
          {...} // routing

          [ ... ] // raw children

      ]

    ]


  }

 */



/*
 * Container
 ****************************************************************
 ****************************************************************
 ****************************************************************
 ****************************************************************
 *
 * Here is the actual container code
 *
 *
 ***************************************************************
 ****************************************************************
 ****************************************************************
 ****************************************************************
 */

// make me a new container please - here is some data and the originating warehouse!
function factory(data, supply_chain){

  var force_tag = null;

  /*
    This can be:

      supply_chain
      blueprint
      container
   */

   // this is for 'new' containers with no supply chain
  if(_.isString(data)){
    force_tag = data;
    if(!_.isFunction(supply_chain)){
      data = supply_chain; 
      supply_chain = null;
    }
  }
  else if(_.isFunction(data)){
    supply_chain = data;
    data = {};
  }

  // ensure the data layout
  data = ensureContainerObject(data);

  if(force_tag){
    data._meta.tagname = force_tag;
  }

  // the base info for a container
  function get_skeleton(){
    return {
      _meta:data._meta,
      _data:data._data
    }
  }

  var attr_pigeonhole = pigeonhole(data);

  // a reference to the in-memory parent - this is passed on by descendent functions
  var parent = null;

  // trigger a 'contract' on the supply chain
  function container(selector, context){

    var self = this;

    // make sure the context is a string
    if(_.isFunction(context)){
      context = '=' + context.quarryid();
    }
    else if(_.isObject(context)){
      context = '=' + context._meta.quarryid;
    }

    // return a promise so they can set some options for the query
    // once the promise is triggered - we end up below with a callback
    // to which we pipe a results container
    return promiseFactory(function(promise_options, return_callback){

      // run the actual query through the supply chain
      route_packet(supply_chain, {
        action:'select',
        message:{
          previous:data._data.root ? null : [get_skeleton()],
          selector_string:_.isString(selector) ? selector : null,
          context_string:_.isString(context) ? context : null,
          selector:selector_parser(selector),
          context:selector_parser(context),
          options:promise_options
        }
      }, function(error, packet){

        // turn the results into an answer container
        //
        packet.answer || (packet.answer = {
          ok:true,
          empty:true
        })
        return_callback(factory(packet.answer.results, supply_chain));
        
      })


     
    })

    

    // the quarryroot switch is so we do not pass previous ids if we are selecting from the root
    

  }

  // allow the container to emit events
  container = _.extend(container, EventEmitter.prototype);

  container._is_container = true;

  container._supply_chain = supply_chain;

  /*
   * Routing
   ****************************************************************
   *
   * The route is where this lives
   *
   * The child route (if set) means append to a different place than route
   *
   *
   ***************************************************************
   */

  /*
    Adds the correct route property to a packet based on the containers route settings
   */
  function route_packet(supply_chain, packet, callback){

    // this container has so supply chain - there is no query, we turn blank
    if(!supply_chain || data._data.silent || data._data.route=='/dev/null'){
      packet.answer = {
        ok:true,
        results:[]
      }
      callback(null, packet);
      return;
    }

    // actions that will ignore if a container has a branch routing (i.e. _meta.route)
    var direct_actions = {
      'save':true,
      'delete':true
    }

    // actions that prioritize a branch routing (i.e. _meta.route)
    var branch_actions = {
      'select':true,
      'append':true
    }

    function action_route(action){
      return direct_actions[action] ?
        (data._data.route) :
        (data._meta.route || data._data.route);
    }

    packet.route = action_route(packet.action);
    
    supply_chain(packet, callback);
  }

  /*
    This is stored in the containers transient data and passed down to descendents
    it says:

    'save / select me from this place'
   */
  function route(val){
    return val ? data._data.route = val : data._data.route;
  }

  /*
    The route for searching / appending to this container
   */
  container.route_packet = function(packet, supply_chain, callback){
    return route_packet(packet, supply_chain, callback);
  }

  /*
    The temporary root set by the containers supply chain
    We pass this down to our descendents
   */
  container.route = function(val){
    return route(val);
  }

  container.root = function(){

    if(arguments.length==0){
      return data._data.root;
    }
    var arg = arguments[0];

    // this means we are setting permissions
    if(_.isObject(arg)){
      data._data.permissions = arg;
    }
    data._data.root = true;

    return true;
  }

  /*
    Returns the permissions that were baked in by the supply chain
    These are passed down to any descendents from this point
    For obvious reasons - this is read only : )
   */
  container.permissions = function(){

    // the default is no permissions
    //
    // read = can see this and descendents
    // write = can change this and descendents
    return data._data.permissions || {};
  }


  /*
   * Ready
   ****************************************************************
   *
   * callback
   *
   *
   ***************************************************************
   */

  /*
    chaining ready trigger
  */
  container.ready = function(callback){
    callback && callback(container);
    return this;
  }

  /*
   * Supply Chain
   ****************************************************************
   *
   * The supply chain a container uses defines its driver
   *
   *
   ***************************************************************
   */

  container.supply_chain = function(){
    return supply_chain;
  }

  /*
   * Blueprints
   ****************************************************************
   *
   * if a container has a _meta.blueprint it is the field list used to last save it
   * if it has a _data.blueprint - some middleware has got involved somewhere
   *
   *
   ***************************************************************
   */

  container.blueprint = function(new_blueprint, datamode){

    // if we are writing a blueprint it goes into _data
    // proper _meta blueprints are created 
    if(new_blueprint){
      
      utils.extend(true, data, new_blueprint.stub());

      if(datamode){
        this.data('blueprint', new_blueprint.raw());
      }
      else{
        this.meta('blueprint', new_blueprint.raw());
      }

    }

    function build_blueprint(from_data){
      if(!from_data){
        return null;
      }

      return blueprint(from_data);
    }

    var ret = build_blueprint(this.meta('blueprint')) || build_blueprint(this.data('blueprint'));

    ret || (ret = blueprint({
      stub:{},
      fields:[],
      options:{}
    }))

    return ret;
  }

  /*
   * Find
   ****************************************************************
   *
   * Direct in memory selector for container descendents
   *
   *
   ***************************************************************
   */

  // the IN MEMORY selector flow - this is always here and hard-coded
  // this is the only method that does not use a stack to resolve selectors
  container.find = function(selector_string){
    var ret = this.find_raw(selector_string);
    return factory(ret, supply_chain);
  }

  /*
   * Save
   ****************************************************************
   *
   * Trigger a save message for this container
   *
   *
   ***************************************************************
   */

  container.save = function(callback){

    // strip the _children and _data from the raw data
    var raw_data = _.clone(data);

    delete(raw_data._children);
    delete(raw_data._data);

    // run the actual query through the supply chain
    route_packet(supply_chain, {
      action:'save',
      message:{
        target:this.skeleton(),
        data:raw_data
      }
    }, function(error, packet){
      this.inject(packet.answer.results);
      callback(error, container);
    })
  }

  /*
    Used to merge the given object into this containers data
   */
  container.merge = function(obj){
    data = _.extend(data, obj);
  }

  /*
    Replace the raw data of the container
   */
  container.inject = function(new_data){
    data = _.extend(data, new_data);
    return this;
  }
  /*
    Returns a cloned version with quarryids replaced
   */
  container.clone = function(use_supply_chain){
    return factory(JSON.parse(JSON.stringify(data)));
  }

  
  /*
   * Structure
   ****************************************************************
   *
   * Modifying the database structure
   *
   *
   ***************************************************************
   */


  // add a child onto the end
  container.append = function(child, preserve, callback){

    if(arguments.length==2){
      if(_.isBoolean(preserve)){

      }
      else{
        callback = preserve;
        preserve = false;  
      }
    }

    var self = this;

    var raw_append = [];

    if(_.isArray(child)){
      raw_append = _.map(child, function(c){
        return _.isFunction(c) ? c.raw() : c;
      })
    }
    else{
      raw_append = [_.isFunction(child) ? child.raw() : child];
    }

    raw_append = _.filter(raw_append, function(t){
      return t!==null;
    })
    
    var filtered_container = factory(raw_append).clone();

    var filtered_raw_data = filtered_container.raw_children(function(d){

      if(!preserve){
        d._meta.quarryid = utils.quarryid();
        delete(d._meta.route);
        delete(d._data);
      }
      
      return d;
    })

    raw_append = filtered_raw_data;

    // if we don't have a supply chain we are appending to RAM
    if(!supply_chain || this.data('silent')){

      // direct injection in RAM
      data._children = data._children.concat(raw_append);
      callback && callback();
    }
    else{

      // now we want to clone the data and replace quarryids
      //raw_append = factory(raw_append).clone().raw_children();

      // don't send a target if we reckon we are adding to a root container
      var use_target = this.quarryid()=='root' || this.meta('route') || this.root() ? null : this.skeleton();

      // run the actual query through the supply chain
      route_packet(supply_chain, {
        action:'append',
        message:{
          target:use_target,
          append:raw_append
        }
      }, function(error, packet){

        var results = packet.answer.results;

        var child_array = _.isArray(child) ? child : [child];

        if(!_.isArray(results)){
          results = [results];
        }

        var i = 0;
        _.each(results, function(result){
          var c = child_array[i];
          if(c){
            c.inject(result);
            c.parent(self);
          }
        })

        callback(error);
      });
    }

    return container;
  }

  container.appendTo = function(parent, callback){
    parent.append(this, callback);
  }

  // add a child onto the end
  container.pourInto = function(parent, preserve, callback){

    parent.append(this.children(), preserve, callback);
    
    return container;
  }

  

  
  /*
   * Children
   ****************************************************************
   *
   * The list of direct children & ancestors
   *
   *
   ***************************************************************
   */

   // access to the child list of containers
  container.children = function(){
    var self = this;
    return _.map(data._children, function(rawChild){

      if(!rawChild){
        throw new Error('no data!')
      }
      // this inherits the permissions and the route from the parent
      rawChild._data || (rawChild._data = {})
      rawChild._data.permissions || (rawChild._data.permissions = self.permissions());
      rawChild._data.route || (rawChild._data.route = self.route());

      var ret = factory(rawChild, supply_chain);

      ret.parent(self);
      
      return ret;
    })
  }

  container.parent = function(new_parent){
    return new_parent ? parent = new_parent : parent;
  }

  /*
   * Data
   ****************************************************************
   *
   * Access to the raw underlying data
   *
   *
   ***************************************************************
   */

  // gets the primitive out of the object
  // if its an object then we recurse and pass the filter through
  container.raw = function(filter){

    if(filter){
      function run_filter(raw){
        var ret = _.extend({}, raw);
        ret._children = _.map(ret._children, run_filter);
        ret = filter(ret);
        return ret;
      }
      return run_filter(data);
    }
    else{
      return data;  
    }
  }

  container.new = function(){
    return factory.apply(this, _.toArray(arguments));
  }

  
  // MAJOR BUG - we want to be able to return this for chaining
  //
  // however - there are places out there are break when the container is returned
  //
  // so we always return the value from the pigeonhold even when jQuery might have chained
  // the main attr accessor
  container.attr = function(field, val){

    var self = this;

    function trigger_update(field, val){
      self.emit('change.' + field, [val]);
    }

    if(arguments.length<=0){
      return stripAttr(container.raw());
    }
    else if(arguments.length==1){
      // multiple update
      if(_.isObject(field)){
        var ret = attr_pigeonhole(field);

        _.each(field, function(v, f){
          trigger_update(f, v);
        })
        
        return ret;
      }
      else{
        return attr_pigeonhole(field);
      }
    }
    else{
      var ret = attr_pigeonhole(field, val);
      trigger_update(field, val);
      return ret;
    }
  }

  // the data accessor
  container.data = function(field, val){
    if(arguments.length==0){
      return data._data;
    }

    field = '_data.' + field;

    var ret = this.attr(field, val);

    return arguments.length==2 || _.isObject(field) ? this : ret;
  }

  // the meta accessor
  container.meta = function(field, val){
    if(arguments.length==0){
      return data._meta;
    }

    field = '_meta.' + field;

    var ret = this.attr(field, val);

    return arguments.length==2 || _.isObject(field) ? this : ret;
  }


  /*
   * Binding
   ****************************************************************
   *
   * Rendering values into the DOM and updating them when the container changes
   *
   * These methods expect jQuery to be on the page
   *
   ***************************************************************
   */
  // copy the current data so we can reset it if needed
  container.take_snapshot = function(){

    this._snapshot = JSON.stringify(this.raw());

  }

  // reset this containers data from the snapshot
  container.restore_snapshot = function(){
    _.extend(data, JSON.parse(this._snapshot));
  }

  // proxy the validation via the blueprint
  container.validate = function(){
    var self = this;
    var blueprint = this.blueprint();

    var status = blueprint.validate(this);

    console.log('validating');
    console.log(status);

    if(status===true){
      return status;
    }
    else{

      _.each(status, function(rules, fieldname){
        self.emit('error.' + fieldname, rules);
      })

      return false;
    }
  }

  container.validate_field = function(fieldname){
    var blueprint = this.blueprint();

    return blueprint.validate_field(this, fieldname);
  }


  /*
   * Loading
   ****************************************************************
   *
   * In memory for a container
   *
   *
   ***************************************************************
   */

  // run a single selector step
  container.run_selector_stage = function(selector){

    var search_function = selector_parser.compile(selector);
    // this is the > child or descendent splitter
    var search_array = selector.splitter=='>' ? this.children() : this.descendents();

    // the in-memory parent selector hack
    if(selector.splitter=='<'){
      var parent = this.parent();
      search_array = parent ? [parent] : [];
    }

    return _.filter(search_array, search_function);
  }

  // run a single selector string in this container
  container.find_raw = function(selector_string){
    var self = this;
    var phases = _.isString(selector_string) ? selector_parser(selector_string) : selector_string;  
    var all_results = [];
    
    _.each(phases, function(selectors){
      var current_results = [self];
      // run each step of the selector in sequence
      _.each(selectors, function(selector){
        var search_results = [];
        _.each(current_results, function(current_result){
          search_results = search_results.concat(current_result.run_selector_stage(selector));
        })
        current_results = search_results;
      })
      all_results = all_results.concat(current_results);
    })

    return _.map(all_results, function(result){
      return result.raw();
    })
  }



  /*
   * Children
   ****************************************************************
   *
   * The list of direct children & ancestors
   *
   *
   ***************************************************************
   */

  // loop the children with a callback
  container.each = function(callback){
    _.each(this.children(), callback);

    return this;
  }

  // return the first child and run the callback optionally
  container.first = function(callback){
    callback && callback(this.at(0));

    return this.at(0);
  }



  // recursive version of children
  container.descendents = function(){
    var descendents = this.children();

    _.each(descendents, function(descendent){
      descendents = descendents.concat(descendent.descendents());
    })

    return descendents;
  }

  /*
    How many children in memory
   */
  container.count = function(){
    return this.children().length;
  }

  // return a child by index
  container.at = function(index){
    index = arguments.length<=0 ? 0 : index;

    var children = this.children();

    return children[index];
  }

  // run a function over each descendent
  container.recurse = function(callback){
    var self = this;
    _.each(this.descendents(), function(descendent){
      callback && callback.apply(self, [descendent]);
    })
  }

  /*
   * Data
   ****************************************************************
   *
   * Access to the raw underlying data
   *
   *
   ***************************************************************
   */

  container.raw_children = function(filter_function){
    return _.map(this.children(), function(child){
      return child.raw(filter_function);
    })
  }

  container.dump = function(){
    return JSON.stringify(this.raw(), null, 4);
  }

  // just _meta and _data
  container.skeleton = function(){
    return {
      _meta:this.meta(),
      _data:this.data()
    }
  }

  /*
   * CSS Properties
   ****************************************************************
   *
   * Access to classnames and quarryids etc
   *
   *
   ***************************************************************
   */

   /*
    Truth test against a selector string
   */
  container.match = function(selector_string){
    // this grabs just the first actual seletor - ignores phases & steps
    var selector = selector_parser(selector_string, true);

    var match_function = selector_parser.compile(selector);

    return match_function(this);
  }

  container.quarryid = function(val){
    return val ? this.meta('quarryid', '' + val) : this.meta('quarryid');
  }

  container.id = function(val){
    if(val){
      this.meta('id', '' + val)
      return this;
    }
    else{
      return this.meta('id');
    }
  }

  container.htmltag = function(){

    var tagname = this.tagname() || 'container';

    var parts = [''];

    var classnames = _.keys(this.classnames());

    if(this.id()){
      parts.push('id="' + this.id() + '"');
    }

    if(classnames.length>0){
      var st = classnames.join(' ');
      parts.push('class="' + st + '"');
    }

    return '<' + parts.join(' ') + ' />'; 
  }

  container.selector_string = function(){
    var tagname = this.tagname() || 'container';

    var parts = [''];

    var classnames = _.keys(this.classnames());

    if(this.id()){
      parts.push('#' + this.id());
    }

    if(classnames.length>0){
      var st = classnames.join('.');
      parts.push('.' + st);
    }

    return tagname + parts.join(' ');
  }

  container.title = function(val){
    if(arguments.length>0){
      this.attr('name', val);
      return this;
    }

    if(this.attr('name')){
      return this.attr('name');
    }

    if(this.attr('title')){
      return this.attr('title');
    }

    if(this.id()){
      return this.id();
    }

    return this.tagname();
  }

  container.name = container.title;

  container.tagname = function(val){
    if(arguments.length>0){
      this.meta('tagname', val);
      return this;
    }

    return this.meta('tagname');
  }

  container.icon = function(val){
    if(arguments.length>0){
      this.meta('icon', val);
      return this;
    }

    return this.meta('icon');
  }
  
  container.classnames = function(val){
    return val ? this.meta('classnames', val) : this.meta('classnames') || {};
  }

  container.hasClass = function(class_name){
    var existing = this.meta('classnames');
    return existing && existing[class_name];
  }

  container.addClass = function(class_name){

    var self = this;
    var parts = class_name.split(' ');

    if(parts.length>1){
      _.each(parts, function(part){
        self.addClass(part);
      })
    }
    else{
      this.meta('classnames') || (this.meta('classnames', {}))
      var existing = this.meta('classnames');
      existing[class_name] = true;
      this.meta('classnames', existing);  
    }
    
    return this;
  }

  /*
   * Helper Properties
   ****************************************************************
   *
   * Methods as per-configure settings
   *
   *
   ***************************************************************
   */

  /*
    Make a new container
  */
  container.create = function(tagname, data){

    if(!data){
      data = tagname;
      tagname = null;
    }

    var ret = factory(data);

    tagname && ret.tagname(tagname);

    return ret;
  }

  container.toString = function(){
    var parts = [
      
    ];

    if(this.tagname()){
      parts.push(this.tagname());
    }

    if(this.id()){
      parts.push('#' + this.id())
    }

    if(_.keys(this.classnames() || {}).length>0){
      parts.push(_.map(_.keys(this.classnames()), function(classname){
        return '.' + classname;
      }).join(''));
    }

    var st = parts.join('');

    if(this.attr('name')){
      st = this.attr('name') + ': ' + st;
    }

    if(st.length<=0){
      st = 'container';
    }
    return st;
  }

  // return JSON formatted raw
  container.pretty = function(){
    return JSON.stringify(this.raw(), null, 4);
  }

  return container;
}



/*
 * 
 ****************************************************************
 ****************************************************************
 ****************************************************************
 ****************************************************************
 *
 * Query Factory - this is the promise returned when you run the 
 * container selector function
 *
 *
 ***************************************************************
 ****************************************************************
 ****************************************************************
 ****************************************************************
 */

// create a new 'holding-place' for when the data is loaded
function promiseFactory(trigger_callback){
  

  // the data holding place
  var result_container = null;

  var started = false;
  var ready = false;

  var stack = [];

  // things like limit etc
  var options = {};

  // the holding function providing 'each' and 'when'
  var promise = function(){
    
  }

  // trigger the promise off with some data
  function trigger(){
    // only do once
    if(started){
      return;
    }

    started = true;

    // pass the options and the 'we have loaded a container' callback
    trigger_callback(options, function(result){
      result_container = result;

      clearStack();
    });
  }

  // add a promise callback to the stack
  function addStack(callback){
    stack.push(callback);

    // we have already done this query
    if(ready){
      clearStack();
    }
    else{
      trigger();
    }
    
    return promise;
  }

  // run all of the callbacks we have stacked up
  function clearStack(){
    _.each(stack, function(stack_function){
      stack_function.apply(promise, [result_container])
    })
    stack = [];
    ready = true;
  }

  // loop the raw data and pass each result as a container
  promise.each = function(callback){
    return addStack(function(result_container){
      result_container.each(callback);
    })

    
  }

  // limit the query to one result and trigger an each
  promise.first = function(callback){
    return addStack(function(result_container){
      result_container.first(callback);
    })
  }

  // 

  // pass a top level container with the results as children
  promise.when = function(callback){
    return addStack(function(result_container){
      callback && callback.apply(promise, [result_container]);
    })
  }

  promise.ready = promise.when;

  // alias
  promise.ship = promise.when;

  return promise;
}

/*
 * Helpers
 ****************************************************************
 ****************************************************************
 ****************************************************************
 ****************************************************************
 *
 * Functions used to setup containers
 *
 *
 ***************************************************************
 ****************************************************************
 ****************************************************************
 ****************************************************************
 */

/*
  Make sure a container object has the fields like _meta and _children
 */
function defaultContainerObject(rawContainer){
  rawContainer || (rawContainer = {});
  rawContainer._meta || (rawContainer._meta = {});
  rawContainer._data || (rawContainer._data = {});
  rawContainer._meta.quarryid || (rawContainer._meta.quarryid = utils.quarryid());
  rawContainer._children || (rawContainer._children = []);
  return rawContainer;
}

/*
  Turn a given value into a proper container object
 */
function ensureContainerObject(data){
  // the passed in data is a list of children
  if(_.isArray(data)){
    return defaultContainerObject({
      _children:data
    })
  }
  else if(_.isFunction(data) || _.isUndefined(data)){
    return defaultContainerObject({
      
    })
  }
  // in this case the data is a normal quarry object
  else if(_.isObject(data)){
    return defaultContainerObject(data);
  }
  // in this case the data is a flat value not a structure
  else{
    return defaultContainerObject({
      _primitive:data
    })
  }
}

// removes the _meta, _children & _data props
function stripAttr(attr){

  if(!_.isObject(attr)){
    return attr;
  }

  attr = _.extend({}, attr);

  delete(attr._children);
  delete(attr._meta);
  delete(attr._data);

  return attr;
}

module.exports = factory;
module.exports.api = {
  "_":_,
  "templates":templates,
  "async":async,
  "EventEmitter":events.EventEmitter,
  "utils":utils,
  "selector":selector_parser,
  "pigeonhole":pigeonhole,
  "blueprint":blueprint
};