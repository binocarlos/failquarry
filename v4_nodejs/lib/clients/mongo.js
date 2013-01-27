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

var mongo = require('mongodb'),
    Db = require('mongodb').Db,
    ObjectID = require('mongodb').ObjectID,
    Server = require('mongodb').Server,
    EventEmitter = require('events').EventEmitter,
    async = require('async'),
    _ = require('underscore');
    
/*
  Quarry.io Mongo Stack
  ---------------------

  Provides a wrapper for a connection to a mongo database

 */


exports = module.exports = factory;

// a singleton to hold onto the various database handles without re-opening each time
var databaseConnection = null;

function ensureDatabaseConnection(options, callback){

  options = _.defaults(options, {
    database:'quarrydb',
    host:'127.0.0.1',
    port:27017
  })

  if(databaseConnection){
    callback(null, databaseConnection);
    return;
  }

  var server = new Server(options.host, options.port, {auto_reconnect: true});
  var db = new Db(options.database, server);
  db.open(function(err){
    if(err) throw err;
    databaseConnection = db;
    callback(null, db);
  });

  db.on('close', function(){
    databaseConnection = null;
  })
  
}

function ensureCollection(options, callback){

  ensureDatabaseConnection(options, function(error, databaseConnection){
    if(error){
      callback(error);
      return;
    }

    databaseConnection.createCollection(options.collection, function(error, collectionConnection){
      callback(error, databaseConnection, collectionConnection);
    })
  })
}

var mapReduce = function(mongoDatabase, mapReduceOptions, callback){

  
}

// make me a new container please - here is some data and the originating warehouse!
function factory(options, ready_callback){

  var client = function(){}

  client = _.extend(client, EventEmitter.prototype);

  ensureCollection(options, function(error, database, collection){
    client.database = database;
    client.collection = collection;

    client.upsert = function(query, data, callback){
      collection.update(query, data, {
        safe:true,
        upsert:true
      }, callback);
    }

    client.find = function(query, callback){
      collection.find(query.query, query.fields, query.options).toArray(callback);
    }

    // map reduce wrapper
    client.mapreduce = function(map_reduce_options, callback){

      map_reduce_options = _.extend({}, map_reduce_options);

      var mapReduce = {
        mapreduce: options.collection, 
        out:  { inline : 1 },
        query: map_reduce_options.query,
        map: map_reduce_options.map ? map_reduce_options.map.toString() : null,
        reduce: map_reduce_options.reduce ? map_reduce_options.reduce.toString() : null,
        finalize: map_reduce_options.finalize ? map_reduce_options.finalize.toString() : null
      }

      database.executeDbCommand(mapReduce, function(err, dbres) {

        var results = dbres.documents[0].results

        callback(err, results);
      })
    }

    ready_callback(error, client);
  })

  return client;
}