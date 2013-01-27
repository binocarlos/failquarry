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