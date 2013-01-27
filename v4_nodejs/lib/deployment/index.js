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
    db_factory = require('./db'),
    async = require('async');

var default_file = process.cwd() + '/quarryio.json';

/*
  Load a deployment given the path to a layout file
 */

function factory(options){

  options = options || {};

  var deployment = Object.create(EventEmitter.prototype);

  options = _.defaults(options, {
    file:default_file
  })

  deployment.file = options.file;

  /*
    Make a new db pointing to the file
   */
  var db = db_factory(deployment.file);
  deployment.db = db;

  /*
    Spins up all of the stack processes
   */
  deployment.start = function(callback){

  }

  /*
    Saves the given profile as a new quarry
   */  
  deployment.save = function(data, callback){
    // save the db
    db.save(data, callback);    
  }

  deployment.create = deployment.save;

  deployment.exists = db.exists;

  return deployment;
}

exports = module.exports = factory;
