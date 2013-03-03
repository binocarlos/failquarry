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

var nested = require('../vendor/backbonedeep');
var helpers = require('./helpers');
var utils = require('../utils');
var Backbone = require('../vendor/backbone');
var _ = require('underscore');
var eyes = require('eyes');

/*
  Quarry.io - Container Model Wrapper
  -----------------------------------

  Represents the data for one model

  It splits the _attr, _meta and _children into their own models

  The _meta and _attr and _children(collection) classes are defined by the warehouse and always
  passed into the wrapper constructor

 */

module.exports = factory;

// the default attributes model is a blank one
// the user will override this from the warehouse
var AttrModel = nested.extend({});
var MetaModel = require('./meta');
var RouteModel = Backbone.Model.extend({});

function factory(options){

  options || (options = {});

  var attr_model = options.attr || AttrModel;
  var meta_model = options.meta || MetaModel;

  function model_accessor(modelname){
    return function(){
      var self = this;
      var model = self[modelname];
      if(arguments.length<=0){
        return model;
      }
      else if(arguments.length==1 && _.isString(arguments[0])){
        return model.get(arguments[0]);
      }
      else if(arguments.length==1 && _.isObject(arguments[0])){
        model.set(arguments[0]);
        return this;
      }
      else if(arguments.length==2){
        var update = {};
        update[arguments[0]] = arguments[1];
        model.set(update);
        return this;
      }
    }
  }

  function property_accessor(modelname, property_name){
    return function(){
      var self = this;
      var model = self[modelname];

      if(arguments.length<=0){
        return model.get(property_name);
      }
      else if(arguments.length==1){
        model.set(property_name, arguments[0]);
        return this;
      }
    }
  }

  function method_accessor(modelname, methodname){

    return function(){
      var self = this;
      var model = self[modelname];

      if(model[methodname]){
        return model[methodname].apply(model, _.toArray(arguments));
      }
      else{
        return null;
      }
    }
  }

  var Base = nested.extend({

    /*
      ensure there is a quarryid for every container
     */
    initialize:function(){

      var self = this;

      this._attr = new attr_model(this.attributes._attr || {});
      this._meta = new meta_model(this.attributes._meta || {});
      this._route = new RouteModel(this.attributes._route || {});

      var this_meta = this.attributes._meta || {};

      this._children = _.map(this.attributes._children, function(raw_child){

        raw_child._meta || (raw_child._meta = {});

        // inject our route into the child if they do not already have one
        if(!raw_child._meta.hostname && this_meta['hostname']){
          raw_child._meta.hostname = this_meta['hostname'];
          raw_child._meta.protocol = this_meta['protocol'];
        }

        return new self.constructor(raw_child);
      })

      _.extend(this._children, Backbone.Events);

      this._is_container_model = true;

      this.map_parent();

      this._attr.on('all', function(){
        self.trigger.apply(self, _.toArray(arguments));
      })
      
      //this.attributes._meta || (this.attributes._meta = {})
      //this.attributes._meta.quarryid || (this.attributes._meta.quarryid = utils.quarryid(true));
    },

    changedAttributes:function(){
      var ret = {
        '_attr':this._attr.changedAttributes(),
        '_meta':this._meta.changedAttributes()
      };

      return ret;
    },

    toJSON:function(){
      return {
        _attr:this._attr.toJSON(),
        _meta:this._meta.toJSON(),
        _route:this._route.toJSON(),
        _children:this.childJSON()
      }
    },

    childJSON:function(){
      return _.map(this._children, function(child){
        return child.toJSON();
      })
    },

    save:function(save_data){
      this._attr.attributes = save_data._attr;
      this._meta.attributes = save_data._meta;
      return this;
    },

    parent:function(){
      return null;
    },

    delete:function(){

    },

    append:function(models){
      var self = this;
      if(_.isEmpty(models)){
        return this;
      }
      if(!_.isArray(models)){
        models = [models];
      }
      _.each(models, function(model){
        self._children.trigger('add', model);
        self._children.trigger('change');
        self._children.push(model);
      })
    },
    
    children:function(){
      return this._children;
    },

    // write the parent() function into containers
    map_parent:function(){
      var self = this;
      _.each(this._children, function(child_model){
        child_model.parent = function(){
          return self;
        }

        child_model.delete = function(){
          self._children = _.filter(self._children, function(c){
            return c.quarryid() != child_model.quarryid();
          })
        }
      })
    },

    attr:model_accessor('_attr'),
    meta:model_accessor('_meta'),
    route:model_accessor('_route'),

    quarryid:property_accessor('_meta', 'quarryid'),
    id:property_accessor('_meta', 'id'),
    tagname:property_accessor('_meta', 'tagname'),
    classnames:property_accessor('_meta', 'classnames'),

    protocol:property_accessor('_route', 'protocol'),
    hostname:property_accessor('_route', 'hostname'),
    resource:property_accessor('_route', 'resource'),

    classname_map:method_accessor('_meta', 'classname_map'),
    addClass:method_accessor('_meta', 'addClass'),
    removeClass:method_accessor('_meta', 'removeClass'),
    hasClass:method_accessor('_meta', 'hasClass'),

    removeAttr:function(arg){
      if(_.isString(arg)){
        this.attr.unset(arg);
      }
      else if(_.isArray(arg)){
        _.each(arg, _.bind(this.attr.unset, this.attr));
      }
      else if(_.isObject(arg)){
        _.each(_.keys(arg), _.bind(this.attr.unset, this.attr)); 
      }
      return this;
    }
      
     
  })

  return Base;
}