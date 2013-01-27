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
    search_in = search_from.parent();
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