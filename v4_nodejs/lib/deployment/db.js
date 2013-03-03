/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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
