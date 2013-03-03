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

var _ = require('underscore'),
    eyes = require('eyes'),
    searcher = require('./search'),
    utils = require('../utils'),
    Backbone = require('../vendor/backbone'),
    Container = require('../container'),
    async = require('async');

module.exports = factory;

/*
  Quarry.io Container Cache
  -------------------------

  Used for holding containers in memory over a period of time

  When the previous results are passed in it is exclusively quarryid used for pre-selection

  To start - this cache just works on quarryid

  options
  -------

  {
    
  }

 */

function factory(options){


  options || (options = {});

  var root_data = options.data || [];

  // maps quarry ids onto models
  var map = {};

  function delete_containers(forcontainer){
    forcontainer.recurse(function(container){
      delete(map[container.quarryid()]);
    })
  }

  function insert_containers(forcontainer){
    forcontainer.recurse(function(container){    
      map[container.quarryid()] = container;
    })
  }

  var root_container = Container.new(root_data);

  if(options.create_ids){
    root_container.ensureids(true);
  }

  insert_containers(root_container);
  
  function cache(){}

  _.extend(cache, Backbone.Events);

  cache.root = root_container;

  cache.from_id = function(id){
    var search_from = map[id];
    if(_.isEmpty(id) || id=='root' || id=='warehouse'){
      search_from = root_container;
    }
    return search_from;
  }

  cache.select = function(selector, skeleton, callback){
    if(!selector){
      callback('no selector given');
      return;
    }
    var id = skeleton.id;
    var search_from = this.from_id(id);
    if(!search_from){
      callback('container not found');
      return;
    }
    
    var results = searcher(search_from, selector);

    callback(null, results ? results.toJSON() : []);
  }

  cache.append = function(data, skeleton, callback){
    var self = this;
    if(!data){
      callback('no data given');
      return;
    }

    var id = skeleton.id;
    var parent = this.from_id(id);

    if(!parent){
      callback('container not found');
      return;
    }

    var original_ids = _.map(data, function(raw){
      return raw.meta ? raw.meta.quarryid : null;
    })

    var children = Container.new(data);
    
    children.ensureids(true);
    
    parent.models.each(function(parent_model){
      parent_model.append(children.basemodels());
    })

    insert_containers(children);

    callback(null, {
      action:'append',
      target:id,
      original_ids:original_ids,
      data:children.toJSON()
    })
  }


  cache.save = function(data, skeleton, callback){
    var self = this;
    if(!data){
      callback('no data given');
      return;
    }
    var id = skeleton.id;
    var save_to = this.from_id(id);

    if(!save_to){
      callback('container not found');
      return;
    }

    save_to.models.each(function(save_model){
      save_model.save(data);
    })

    callback(null, {
      action:'save',
      target:id,
      data:save_to.toJSON()
    })
  }


  cache.delete = function(skeleton, callback){
    var self = this;
    var id = skeleton.id;
    var delete_container = this.from_id(id);

    if(!delete_container){
      callback('container not found');
      return;
    }
    
    var delete_what = delete_container.get(0);
    var delete_from = delete_what.parent;

    if(delete_from){
      delete_from.removeChild(delete_what);
    }

    delete_containers(delete_container);
    
    callback(null, {
      action:'delete',
      target:id
    })
  }

  return cache;
}