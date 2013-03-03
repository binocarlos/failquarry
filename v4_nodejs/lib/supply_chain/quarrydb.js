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

