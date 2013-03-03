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
    containerFactory = require('../../../container'),
    utils = require('../../../utils'),
    eyes = require('eyes'),
    async = require('async');
    
/*
  Quarry.io Quarrydb -> Select Stage
  ----------------------------------

  Single Action of a single selector stage

  options
  -------

  {
    
  }

 */


var operator_functions = {
  "=":function(field, value){
    var ret = {};
    ret[field] = value;
    return ret;
  },
  "!=":function(field, value){
    var ret = {};
    ret[field] = {
      '$ne':value
    }
    return ret;
  },
  ">":function(field, value){
    var ret = {};
    ret[field] = {
      '$gt':parseFloat(value)
    }
    return ret;
  },
  ">=":function(field, value){
    var ret = {};
    ret[field] = {
      '$gte':parseFloat(value)
    }
    return ret;
  },
  "<":function(field, value){
    var ret = {};
    ret[field] = {
      '$lt':parseFloat(value)
    }
    return ret;
  },
  "<=":function(field, value){
    var ret = {};
    ret[field] = {
      '$lte':parseFloat(value)
    }
    return ret;
  },
  "^=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp('^' + utils.escapeRegexp(value), 'i')
    }
    return ret;
  },
  "$=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp(utils.escapeRegexp(value) + '$', 'i')
    }
    return ret;
  },
  "~=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp('\W' + utils.escapeRegexp(value) + '\W', 'i')
    }
    return ret;
  },
  "|=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp('^' + utils.escapeRegexp(value) + '-', 'i')
    }
    return ret;
  },
  "*=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp(utils.escapeRegexp(value), 'i')
    }
    return ret;
  }
}

// get the Mongo Query for the link tree
function getLinkTreeQuery(splitter, raw_data_array){
  var or_array = [];

  _.each(raw_data_array, function(raw_data){
    
    // child mode
    if(splitter=='>'){
      if(_.isString(raw_data)){
        or_array.push({
          'meta.quarryid':raw_data
        })
      }
      else{
        or_array.push({
          'meta.links.parent_id':raw_data._meta.quarryid
        })  
      }
    }
    // parent mode
    else if(splitter=='<'){
      var first_link = 
      _.each(raw_data._meta.links, function(link){
        or_array.push({
          'meta.quarryid':link.parent_id
        })
      })
      
    }
    // descendent mode
    else{
      
      var links = raw_data._meta && raw_data._meta.links ? raw_data._meta.links : [];
      var first_link = links[0] || {};

      or_array.push({
        '$and':[{
          'meta.links.left':{
            '$gt':first_link.left
          }
        },{
          'meta.links.right':{
            '$lt':first_link.right
          }
        }]
      })
    }
  })

  if(or_array.length<=0){
    return null;
  }
  else if(or_array.length==1){
    return or_array[0];
  }
  else{
    return {
      '$or':or_array
    }
  }
}

function getQuery(req){

  var previous = req.skeleton();
  var selector = req.selector();

  //var message = packet.message;
  //var selector = _.isArray(message.selector) ? message.selector[0][0] : message.selector;
  //var previous = message.previous;

  // are we the last selector (i.e. grab all fields)
  //var skeleton = message.skeleton;

  var query_array = [];
  var main_query = {};

  previous = _.filter(previous, function(raw_data){
    return raw_data.meta && raw_data.meta.quarryid!='warehouse';
  })

  // this is for a thing like:
  //    > folder.red product
  // i.e. folders on the root
  if(selector.splitter=='>' && (!previous || previous.length<=0)){
    main_query = {
      'meta.links.parent_id':null
    }
  }
  else if(selector.quarryid){
    main_query = {
      'meta.quarryid':selector.quarryid
    }
  }
  else{
    if(selector.tagname=='*'){
      query_array.push({
        '$where':'1==1'
      })
    }
    else {
      if(selector.tagname){
        query_array.push({
          'meta.tagname':selector.tagname
        });
      }

      if(selector.id){
        query_array.push({
          'meta.id':selector.id
        });
      }

      if(selector.classnames){

        _.each(_.keys(selector.classnames), function(classname){

          query_array.push({
            'meta.classnames':classname
          })
          
        })
      }

      if(selector.attr){
        _.each(selector.attr, function(attr){
          var field = 'attr.' + attr.field;
          var operator = attr.operator;
          var value = attr.value;

          if(_.isEmpty(operator)){
            query_array.push({
              field:{
                '$exists':true
              }
            });
          }
          else{
            var operator_function = operator_functions[operator];

            query_array.push(operator_function(field, value));
          }
        })
      }
    }

    // are we looking within other results?
    if(previous){
     
      // the query that applies nested set on the links inside the _meta
      var link_tree_query = getLinkTreeQuery(selector.splitter, previous);

      if(link_tree_query){
        query_array.push(link_tree_query);  
      }
    }

    main_query = query_array.length<=1 ? query_array[0] : {
      '$and':query_array
    }
  }

  var options = {

  }

  return {
    query:main_query,
    //fields:fields,
    fields:null,
    options:options,
    tree:selector.modifier && selector.modifier.tree
  }

}

var select = module.exports = function(req, res, next){

  var query = getQuery(req);

  var self = this;

  this.mongoclient.find(query, function(error, results){

    req.stampResponse(res);
    res.contentType('quarry/containers')

    // here are the final results
    // check for a tree query to load all descendents also
    if(query.tree && results.length>0){

      // first lets map the results we have by id
      var results_map = {};

      _.each(results, function(result){
        results_map[result.meta.quarryid] = result;
      })

      // now build a descendent query based on the results
      var descendent_query = getLinkTreeQuery('', results);

      descendent_query.fields = query.fields;

      // trigger the find of the descendents
      mongo_client.find(descendent_query, function(error, descendent_results){

        // loop each result and it's links to see if we have a parent in the original results
        // or in these results
        _.each(descendent_results, function(descendent_result){
          results_map[descendent_result.meta.quarryid] = descendent_result;
        })

        _.each(descendent_results, function(descendent_result){
          _.each(descendent_result.meta.links, function(link){
            var parent = results_map[link.parent_id];

            if(parent){
              parent.children.push(result);
            }
          })            
        })

        res.send(self.selectmapper(req, results));
      })
    }
    else{
      res.send(self.selectmapper(req, results));
    }      
  })
}