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
    containerFactory = require('../container'),
    messageFactory = require('../message'),
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


function factory(warehouse, options){

  var radio = warehouse.radio();

  options || (options = {});

  var root_data = options.data || [];

  // maps quarry ids onto models
  var map = {};

  function prepare_insert_data(forcontainer){
    forcontainer.recurse(function(container){
      container.quarryid(utils.quarryid());
    })

    return forcontainer;
  }

  function delete_containers(forcontainer){
    forcontainer.recurse(function(container){
      delete(map[container.quarryid()]);
    })
  }

  function insert_containers(forcontainer){
    forcontainer.recurse(function(container){
      map[container.quarryid()] = container.get(0);

    })
  }

  var root_container = containerFactory(root_data);

  options.create_ids && root_container.ensure_ids();

  insert_containers(root_container);
  
  function cache(){}

  _.extend(cache, Backbone.Events);

  cache.root = root_container;
  
  cache.run_selector = function(previous, selector){

    var search_from = this.from_skeleton(previous);

    var ret = searcher(search_from, selector);

    return ret;
  }

  cache.append = function(skeleton, append_data){
    var self = this;
    var append_to = this.from_skeleton(skeleton);
    var append = containerFactory(append_data);

    var actions = [];


    // we are appending to the very top
    if(append_to._is_warehouse){
      
      var appendactual = prepare_insert_data(append.clone());

      _.each(appendactual.models, function(append_model){
        append_to.models.push(append_model);
      })

      insert_containers(appendactual);

      radio.broadcast('/append', {
        path:'/append',
        target:append_to.get_skeleton(),
        data:appendactual.toJSON()
      })

    }
    else{

      append_to.each(function(append_to_container){

        var appendactual = prepare_insert_data(append.clone());

        var model = append_to_container.get(0);
        model.append(appendactual.models);

        insert_containers(appendactual);

        radio.broadcast('/append', {
          path:'/append',
          target:append_to.get_skeleton(),
          data:appendactual.toJSON()
        })
        
      })  
    }

    return {
      ok:true,
      count:append.count()
    }
  },

  cache.save = function(skeleton, data){
    var self = this;
    var save_to = this.from_skeleton(skeleton);
    
    var actions = [];

    save_to.each(function(save_to_container){

      var model = save_to_container.get(0);

      model.save(data);

      radio.broadcast('/append', {
        path:'/save',
        target:save_to_container.get_skeleton(),
        data:data
      })

    })

    return {
      ok:true
    }
  },

  cache.delete = function(skeleton){
    var self = this;
    var deletes = this.from_skeleton(skeleton);
    
    var actions = [];

    deletes.each(function(delete_container){

      var model = delete_container.get(0);

      var parent = model.parent ? model.parent() : null;

      // this must mean it is a root model
      if(!parent){        
        root_container.models = _.filter(root_container.models, function(testmodel){
          return model.quarryid()!=testmodel.quarryid();
        })
      }
      else{
        model.delete();
      }

      delete_containers(delete_container);
      
      radio.broadcast('/append', {
        path:'/delete',
        target:save_to_container.get_skeleton()
      })
    })

    return {
      ok:true,
      count:deletes.count()
    }
  },

  // return an array of the containers pointed to by the skeleton array
  cache.from_skeleton = function(skeleton){

    var found_root = false;

    var context_models = _.filter(_.map(skeleton, function(raw){

      // at this point raw is the _meta
      var tagname = raw._meta && raw._meta.tagname ? raw._meta.tagname : null;
      var id = raw._meta && raw._meta.quarryid ? raw._meta.quarryid : null;

      if(tagname=='warehouse'){

        found_root = true;
        return null;
      }

      return map[id];
    }), utils.notnull);

    if(found_root){
      root_container._is_warehouse = true;
      return root_container;
    }
    else{
      return containerFactory(context_models);
    }
  }

  cache.by_id = function(id){
    return containerFactory(map[id] ? map[id] : null);
  }

  cache.get = function(id){
    return map[id];
  }

  cache.add = function(id, model){
    map[id] = model;
    return this;
  }

  return cache;
}