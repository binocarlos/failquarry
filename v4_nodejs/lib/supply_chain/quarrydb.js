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
    containerFactory = require('../container'),
    mongo = require('../clients/mongo'),
    async = require('async'),
    eyes = require('eyes'),
    api = require('../supply_chain'),
    select_stage_helper = require('./quarrydb/select_stage'),
    append_helper = require('./quarrydb/append'),
    save_helper = require('./quarrydb/save');
    
/*
  Quarry.io Quarrydb supply chain
  -------------------------------

  Points into a mongodb collection and uses the rationalnestedset encoder

  options
  -------

  {
    
  }

 */



function factory(options, ready_callback){

  options = _.defaults(options, {
    collection:'bob'
  })

  var actions = {};

  var mongo_client = null;

  // standard closure for a supply chain entry function
  var quarrydb = api.supply_chain_factory(actions);

  quarrydb.options = options;

  // preapre the mongo connection for our collection
  mongo(options, function(error, client){
    mongo_client = client;
    ready_callback && ready_callback(null, quarrydb);
  })

  /*
    quarrydb!
   */
  actions.select = api.reduce_select(function(packet, callback){

    select_stage_helper(mongo_client, packet, callback);
    
  })

  /*
    select a single selector stage

   */
  actions.select_stage = function(packet, callback){

    select_stage_helper(mongo_client, packet, callback);
    
  }

  /*
    append one container to another
   */
  actions.append = function(packet, callback){

    append_helper(mongo_client, packet, callback);
  }

  /*
    save one containers data
   */
  actions.save = function(packet, callback){

    save_helper(mongo_client, packet, callback);
  }

  return quarrydb;
}

// expose createModule() as the module
exports = module.exports = factory;

