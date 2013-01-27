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
  stack/db is a wrapper for the JSON file that describes the layout of a stack's services and resources
*/

/*
  Module dependencies.
*/

var _ = require('underscore'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    async = require('async');


/*
  Make a new stack given the layout (which can be a filepath or raw JSON)
 */

function factory(file, callback){

  var stackJSON = {
    name:'',
    admin:{
      email:''
    },
    services:[],
    resources:[]
  };

  try{
    stackJSON = require(file);
  }
  catch(e){
    console.log('stack json error: ' + e);
  }

  var db = Object.create(EventEmitter.prototype);

  db.save = function(data, callback){
    fs.writeFile(file, JSON.stringify(data), 'utf8', callback);
  }

  db.exists = function(callback){
    fs.stat(file, callback);
  }

  db.raw = function(){
    return stackJSON;
  }

  return db;
}

exports = module.exports = factory;
