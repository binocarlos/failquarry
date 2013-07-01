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

var _ = require('lodash');
var eyes = require('eyes');

/*
  Quarry.io Quarrydb -> tools
  ----------------------------------

  generic mongo functions

 */

function save(mongo_client, query, data, callback){

  mongo_client.update(query, data, callback);

}

function insert(mongo_client, data, callback){

  var insert_data = _.clone(data);
  
  delete(insert_data.children);

  if(!insert_data._id){
    insert_data._id = insert_data.meta.quarryid;
  }
  
  mongo_client.upsert({
    "meta.quarryid":insert_data.meta.quarryid
  }, insert_data, function(error, res){
    callback(error, insert_data);
  })
  
}

function del(mongo_client, skeleton, callback){

  if(!skeleton){
    callback('no skeleton');
    return;
  }

  var query = _.isString(skeleton) ? {
    "meta.quarryid":skeleton
  } : {
    "$and":[{
      "meta.left":{
        "$gte":skeleton.left
      },
      "meta.right":{
        "$lte":skeleton.right
      }
    }]
  }

  mongo_client.collection.remove(query, function(error, res){
    callback(error, res);
  })
  
}

// expose createModule() as the module
module.exports.save = save;
module.exports.del = del;
module.exports.insert = insert;