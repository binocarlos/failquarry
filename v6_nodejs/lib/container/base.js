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

var BackboneDeep = require('../vendor/backbonedeep');
var Backbone = require('../vendor/backbone');
var _ = require('underscore');
var utils = require('../utils');
var eyes = require('eyes');

/*
  Quarry.io - Container Model Wrapper
  -----------------------------------

  Represents the data for one model

  It splits the attr, meta and children into their own models

  The meta and attr and children(collection) classes are defined by the warehouse and always
  passed into the wrapper constructor

 */

var AttrModel = BackboneDeep.extend();

module.exports = BackboneDeep.extend({

  idAttribute:'meta.quarryid',
  /*

    The attr model is the users Backbone model that wraps their attributes


   */
  attrmodel:AttrModel,

  /*

  
    A flag present in all base models that

   */
  _is_quarry_wrapper:true,

  initialize:function(){

    var self = this;

    /*

      

     */
    this.attr = new this.attrmodel(this.get('attr'));

    var child_models = _.map(this.get('children'), function(child_data){
      return new self.constructor(child_data);
    })

    this.children = new Backbone.Collection(child_models);

    this.children.each(function(child_model){
      child_model.parent = self;
    })

    this.ensureid();
  },

  strip:function(){

  },

  toJSON:function(){
    return {
      attr:this.attr.toJSON(),
      meta:this.get('meta') || {},
      routes:this.get('routes') || {},
      children:this.children.toJSON()
    }
  },

  hasClass:function(classname){
    var classnames = this.get('meta.classnames') || [];
    return _.indexOf(classnames, classname)!=-1;
  },

  addClass:function(classname){
    var classnames = this.get('meta.classnames') || [];
    classnames.push(classname);
    this.set('meta.classnames', _.unique(classnames));
    return this;
  },

  removeClass:function(classname){
    var classnames = this.get('meta.classnames') || [];
    this.set('meta.classnames', _.without(classnames, classname));
    return this;
  },

  getParent:function(){
    return this.parent;
  },

  getChildren:function(){
    return this.children.models;
  },

  // insert an array of models into the children collection
  append:function(models){
    var self = this;
    _.each(models, function(model){
      model.parent = self;
      model.ensureRoute(self.get('route'));
      self.children.add(model);
    })
    return this;
  },

  removeChild:function(model){
    this.children.remove(model);
  },

  remove:function(models){
    this.children.remove(models);
  },

  assignModel:function(attr_model){
    this.attr = attr_model;
    return this;
  },

  /*

    Return the supplier skeleton data baked with the quarryid

   */
  skeleton:function(options){
    options || (options = {})
    var ret = _.extend({}, this.get('meta.skeleton'), {
      id:this.quarryid(),
      routes:this.get('routes') || {}
    })

    if(options.data){
      ret.data = this.toJSON();
      delete(ret.data.children);
    }

    return ret;
  },

  resetid:function(includechildren){

    this.quarryid(utils.quarryid(true));

    if(includechildren){
      _.each(this.descendents(), function(descendent){
        descendent.quarryid(utils.quarryid(true));
      })  
    }

    return this;
  },

  save:function(data){
    this.set(data);
    data.attr && this.attr.set(data.attr);
    return this;
  },

  // make sure the model has an id - full means we are about to actually save it into a database
  ensureid:function(forsaving){
    if(this.issaved()){
      return this;
    }
    else if(forsaving){
      this.quarryid(utils.quarryid());
    }
    else{
      this.quarryid(utils.quarryid(true));
    }
    return this;
  },

  quarryid:function(){
    if(arguments.length==1){
      this.set('meta.quarryid', arguments[0]);
      return this;
    }
    else{
      return this.get('meta.quarryid') || '';
    }
  },

  // do we have a full quarryid or a temporary one
  issaved:function(){
    return this.has('meta.quarryid') && this.quarryid().length>8;
  },

  // return a flat array of all descendents including this level
  descendents:function(){
    var all_models = [];
    function find_model(model){
      all_models.push(model);
      model.children.each(find_model);
    }
    this.children.each(find_model);
    return all_models;
  },


  ////////////////////////////////////////////////////////
  /// ALL OF THIS STUFF SHOULD LIVE IN LISTENERS OUTSIDE

  /*

    an object representing the route for this container
      hostname
      path
      id
      quarry.io/ramfile/bob1/23
  
    recursivly add the route into the tree of models

   */
  router:function(){
    var self = this;
    if(arguments.length==0){
      return this.get('routes') || {};
    }
    else if(arguments.length==1){
      var routes = this.router();
      return routes[arguments[0]];
    }
    else{
      var routes = this.router();
      if(!_.isEmpty(arguments[1])){
        routes[arguments[0]] = arguments[1];  
      }
      this.set({
        routes:routes
      }, {
        silent:true
      })
      return self; 
    }
  },

  // a proxy to router('main')
  route:function(){
    var args = _.toArray(arguments);
    args.unshift('stamp');
    return this.router.apply(this, args);
  },

  frequency:function(){
    var route = this.route() || '';

    route += '/' + this.quarryid();

    return route.replace(/^\//, '').replace(/\//g, '.');
  },
  
  /*
  
    Provide the route from parent nodes

   */
  ensureRoute:function(route){
    this.route(route);
    _.each(this.getChildren(), function(child){
      child.ensureRoute(route);
    })
    return this;
  }
})