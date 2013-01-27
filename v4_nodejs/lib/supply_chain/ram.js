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
    EventEmitter = require('events').EventEmitter,
    api = require('../supply_chain'),
    eyes = require('eyes'),
    containerFactory = require('../container'),
    async = require('async');
    
/*
  Quarry.io RAM Supplier
  -------------------

  In memory supplier

  options
  -------

  {
    
  }

 */



function factory(raw_data, ready_callback){

  var data = raw_data || {};

  var actions = {};

  // standard closure for a supply chain entry function
  var ram = api.supply_chain_factory(actions);

  ram.data = function(){
    return data;
  }

  ready_callback && ready_callback(null, ram);

  /*
    run a single selector stage over the RAM data
   */
  actions.select = api.reduce_select(function(packet, callback){

    var message = packet.message;
    
    var selector = message.selector;
    var previous = message.previous;
    var skeleton = message.skeleton;

    var modifiers = selector[0][0].modifier || {};

    var root_container = containerFactory(data);
    var search_within_containers = [];

    // do we have any previous results to search within?
    if(previous && previous.length>0){

      var previous_ids = {};

      _.each(previous, function(prev){
        previous_ids[prev] = true;
      })

      // grab the containers by their id within the descendents
      search_within_containers = _.filter(root_container.descendents(), function(descendent){
        return previous_ids[descendent.quarryid()];
      })
    }
    else{
      // this is the root container as the starting point
      search_within_containers = [root_container];

    }

    var all_results = [];

    _.each(search_within_containers, function(search_within_container){

      // we wrap the selector in a phase array because the container raw is not a supply chain
      var results = search_within_container.find_raw(selector);

      if(skeleton){
        results = _.map(results, function(result){
          return {
            _meta:result._meta,
            _data:result._data
          }
        })
      }
      all_results = all_results.concat(results);
    })

    // we force the select results through JSON so we don't corrupt data left right and center!

    all_results = JSON.parse(JSON.stringify(all_results));

    all_results = _.map(all_results, function(result){
      if(modifiers.tree){

      }
      else{
        result._children = [];
      }

      return result;
    })

    

    packet.answer = {
      ok:true,
      results:all_results
    }

    callback(null, packet);

  
  })

  /*
    append one container to another
   */
  actions.append = function(packet, callback){

    var message = packet.message;


    var search_container = containerFactory(data);

    var parent_id = _.isObject(message.target) ? message.target._meta.quarryid : message.target;
    var child_data = message.append;

    if(!_.isArray(child_data)){
      child_data = [child_data];
    }

    var results = [];

    _.each(child_data, function(child_data_single){
      if(!parent_id){
        data = data.concat([child_data_single]);
      }
      else{
        var parent_container = search_container.find('=' + parent_id).first();

        if(parent_container){
          parent_container.append(containerFactory(child_data_single));
          results.push(child_data_single);
        }
        
      }
    })

    packet.answer = {
      ok:true,
      results:results
    }

    callback(null, packet);
  }

  /*
    save the data for one container
   */
  actions.save = function(packet, callback){

    var message = packet.message;

    // the id of the container we want to save
    var target_id = _.isObject(message.target) ? message.target._meta.quarryid : message.target;

    var search_container = containerFactory(data);

    // select the container we want to update
    var target_container = search_container.find('=' + target_id).first();

    if(target_container){
      
      // merge the save data into the target
      target_container.merge(message.data);

    }
    
    packet.answer = {
      ok:true,
      results:target_container ? target_container.raw() : null
    }
    // we are done!
    callback(null, packet);
  }

  return ram;
}

// expose createModule() as the module
exports = module.exports = factory;

