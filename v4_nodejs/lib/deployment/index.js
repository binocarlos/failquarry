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
