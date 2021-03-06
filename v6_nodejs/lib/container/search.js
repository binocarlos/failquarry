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

var _ = require('underscore');
var async = require('async');
var selectorParser = require('../query/selector')
var eyes = require('eyes')
module.exports = reduce;

/*
  Quarry.io - Container Search
  ----------------------------

  Takes a search_from container and an array of strings

  It reverses the strings and does a simulated pipe


 */

function search(search_from, selector){

  var selector_filter = selectorParser.compile(selector);

  var search_in = search_from;

  // we must now turn the search_from container into a flat array of the things to actually search

  // direct child mode
  if(selector.splitter=='>'){
    if(search_from.is('warehouse')){
      search_in = search_from;
    }
    else{
      search_in = search_from.children();  
    }
  }
  // direct parent mode
  else if(selector.splitter=='<'){
    throw new Error('we do not support the parent splitter at the moment');
  }
  // all descendents mode
  else{
    search_in = search_from.descendents();
  }

  // now we loop each child container piping it via the selector filter
  return search_in.filter(selector_filter);
}

function selector(search_from, selector_string){
  var phases = [];

  if(_.isString(selector_string)){
    phases = selectorParser(selector_string);
  }
  else if(_.isArray(selector_string)){

  }
  else if(_.isObject(selector_string)){
    phases = [selector_string];
  }

  // make a blank container but hooked up to the original supply chains
  var all_results = [];

  _.each(phases, function(phase){

    if(!_.isArray(phase)){
      phase = [phase];
    }

    var current_search = search_from;
    _.each(phase, function(selector){
      current_search = search(current_search, selector);
    })

    all_results = all_results.concat(current_search.basemodels());
  })

  return search_from.spawn(all_results);
}

/*
  This is the sync version of a warehouse search used by in-memory container 'find' commands

  The packet will be either a straight select or a contract
 */
function reduce(search_from, selector_array){

  if(!_.isArray(selector_array)){
    selector_array = _.isEmpty(selector_array) ? [] : [selector_array];
  }

  _.each(selector_array.reverse(), function(selectorobj){
    search_from = selector(search_from, selectorobj);    
  })

  return search_from;
}