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

var _ = require('lodash'),
    utils = require('../../utils'),
    eyes = require('eyes'),
    async = require('async');

/*
  Quarry.io Quarrydb -> Ensure Skeleton
  -------------------------------------

  If we have a skeleton with just id's - this will load the meta data
  properly from the DB first


 */

function map(skeleton){
  return {
    "meta.quarryid":skeleton.quarryid
  }
}

var extract = module.exports = function(mongoclient, req, res, callback){

  var skeleton = req.getHeader('x-json-skeleton') || [];
      
  /*
  
    if there is already a left value then we already have a full skeleton
    
  */
  if(skeleton.length<=0 || skeleton[0].left){
    req.setHeader('x-json-skeleton', skeleton);
    callback();
    return;
  }
  
  if(skeleton[0].supplychainroot || skeleton[0].tagname=='supplychain'){
    req.setHeader('x-json-skeleton', []);
    callback();
    return;
  }

  var id_clause = _.map(skeleton, map);

  var query = {
    query:{
      '$or':id_clause
    },
    fields:{
      "meta":true
    }
  }

  mongoclient.find(query, function(error, results){
    
    if(error){
      res.error(error);
      return;
    }

    var skeleton_results = _.map(results, function(result){
      return result.meta;
    })

    req.setHeader('x-json-skeleton', skeleton_results);
    
    callback();

  })
}