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

var utils = require('../utils');
var _ = require('underscore');
var eyes = require('eyes');

module.exports = parseSelector;
module.exports.compile = compile;

/*
  Quarry.io Selector
  -------------------

  Represents a CSS selector that will be passed off to selectors or perform in-memory search

 */

/***********************************************************************************
 ***********************************************************************************
  Here is the  data structure:

  "selector": " > * product.onsale[price<100] > img caption.red, friend",
  "phases":
    [
      [
          {
              "splitter": ">",
              "tagname": "*"
          },
          {
              "splitter": "",
              "tagname": "product",
              "classnames": {
                  "onsale": true
              },
              "attr": [
                  {
                      "field": "price",
                      "operator": "<",
                      "value": "100"
                  }
              ]
          },
          {
              "splitter": ">",
              "tagname": "img"
          },
          {
              "splitter": "",
              "tagname": "caption",
              "classnames": {
                  "red": true
              }
          }
      ],
      [
          {
              "tagname": "friend"
          }
      ]
    ]

 */

/*
  Regular Expressions for each chunk
*/

var chunkers = [
  // the 'type' selector
  {
    name:'tagname',
    regexp:/^(\*|\w+)/,
    mapper:function(val, map){
      map.tagname = val;
    }
  },
  // the '.classname' selector
  {
    name:'classnames',
    regexp:/^\.\w+/,
    mapper:function(val, map){
      map.classnames || (map.classnames={});
      map.classnames[val.replace(/^\./, '')] = true;
    }
  },
  // the '#id' selector
  {
    name:'id',
    regexp:/^#\w+/,
    mapper:function(val, map){
      map.id = val.replace(/^#/, '');
    }
  },
  // the '=quarryid' selector
  {
    name:'quarryid',
    regexp:/^=[\w-]+/,
    mapper:function(val, map){
      map.quarryid = val.replace(/^=/, '');
    }
  },
  // the ':modifier' selector
  {
    name:'modifier',
    regexp:/^:\w+/,
    mapper:function(val, map){
      map.modifier || (map.modifier={});
      map.modifier[val.replace(/^:/, '')] = true;
    }
  },
  // the '[attr<100]' selector
  {
    name:'attr',
    regexp:/^\[.*?["']?.*?["']?\]/,
    mapper:function(val, map){
      map.attr || (map.attr=[]);
      var match = val.match(/\[(.*?)([=><\^\|\*\~\$\!]+)["']?(.*?)["']?\]/);
      if(match){
        map.attr.push({
          field:match[1],
          operator:match[2],
          value:match[3]
        });
      }
      else {
        map.attr.push({
          field:attrString.replace(/^\[/, '').replace(/\]$/, '')
        });
      }
    }
  },
  // the ' ' or ' > ' splitter
  {
    name:'splitter',
    regexp:/^[ ,<>]+/,
    mapper:function(val, map){
      map.splitter = val.replace(/\s+/g, '');
    }

  }
];

/*
  These functions are used to run attribute selectors over in-memory containers
 */
var attr_compare_functions = {
  "=":function(check, target){
    return !_.isUndefined(check) && check==target;
  },
  "!=":function(check, target){
    return !_.isUndefined(check) && check!=target;
  },
  ">":function(check, target){
    target = parseFloat(target);
    return !_.isUndefined(check) && !isNaN(target) ? check > target : false;
  },
  ">=":function(check, target){
    target = parseFloat(target);
    return !_.isUndefined(check) && !isNaN(target) ? check >= target : false;
  },
  "<":function(check, target){
    target = parseFloat(target);
    return !_.isUndefined(check) && !isNaN(target) ? check < target : false;
  },
  "<=":function(check, target){
    target = parseFloat(target);
    return !_.isUndefined(check) && !isNaN(target) ? check <= target : false;
  },
  "^=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp('^' + utils.escapeRegexp(target), 'i')) != null;
  },
  "$=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp(utils.escapeRegexp(target) + '$', 'i')) != null;
  },
  "~=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp('\W' + utils.escapeRegexp(target) + '\W', 'i')) != null;
  },
  "|=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp('^' + utils.escapeRegexp(target) + '-', 'i')) != null;
  },
  "*=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp(utils.escapeRegexp(target), 'i')) != null;
  },
}

/*
  Turn a selector object into a compiled function to have containers run through
 */

function compile(selector){


  // return a function that will return boolean for a container matching this selector
  return function(container){

    // we step through one at a time - as soon as something fails we do not match

    // if we have a wildcard then we pass
    if(selector.tagname=='*'){
      return true;
    }

    // #id
    if(selector.id && container.id()!=selector.id){
      return false;
    }

    // =quarryid
    if(selector.quarryid && container.quarryid()!=selector.quarryid){
      return false;
    }

    // tagname
    if(selector.tagname && container.tagname()!=selector.tagname){
      return false;
    }

    // classnames
    if(selector.classnames){
      var container_classnames = container.classname_map();

      // make sure ALL of the classnames in the selector are in the container
      var all_classnames_present = _.all(_.keys(selector.classnames), function(classname){
        return container_classnames[classname] ? true : false;
      })

      if(!all_classnames_present){
        return false;
      }
    }

    if(selector.attr){

      var all_attributes_passed = _.all(selector.attr, function(attr_filter){

        var check_value = container.attr(attr_filter.field);
        var operator_function = attr_compare_functions[attr_filter.operator];

        // [size]
        if(!attr_filter.value){
          return check_value != null;
        }
        // [size>100]
        else if(operator_function){
          return operator_function.apply(null, [check_value, attr_filter.value]);
        }
        // no operator function found
        else{
          return false;
        }
      })

      if(!all_attributes_passed){
        return false;
      }

    }

    // if we get here then the container has passed all the tests!!!
    return true;
  }
}

/**
  Parse selector string into flat array of chunks
 
  Example in: product.onsale[price<100]
 */
function parseChunks(selector){

  var lastMatch = null;
  var workingString = selector ? selector : '';
  var lastString = '';

  // this is a flat array of type, string pairs
  var chunks = [];

  var matchNextChunk = function(){

    lastMatch = null;

    for(var i in chunkers){
      var chunker = chunkers[i];

      if(lastMatch = workingString.match(chunker.regexp)){

        // merge the value into the chunker data
        chunks.push(_.extend({
          value:lastMatch[0]
        }, chunker));

        workingString = workingString.replace(lastMatch[0], '');

        return true;
      }
    }
    
    return false;

  }
  
  // the main chunking loop happens here
  while(matchNextChunk()){
    
    // this is the sanity check in case we match nothing
    if(lastString==workingString){
      break;
    }
  }

  return chunks;
}



/**
 * turns a selector string into an array of arrays (phases) of selector objects
 *
 * @api public
 */
function parseSelector(selector){

  if(!_.isString(selector)){
    throw new Error('selector must be a string')
  }
  var chunks = parseChunks(selector);

  var phases = [];
  var currentPhase = [];
  var currentSelector = {};

  var addCurrentPhase = function(){
    if(currentPhase.length>0){
      phases.push(currentPhase);
    }
    currentPhase = [];
  }

  var addCurrentSelector = function(){
    if((_.keys(currentSelector)).length>0){
      currentPhase.push(currentSelector);
    }
    currentSelector = {};
  }

  var addChunkToSelector = function(chunk, selector){
    chunk.mapper.apply(null, [chunk.value, selector]);
  }

  _.each(chunks, function(chunk){
    if(chunk.name=='splitter' && chunk.value.match(/,/)){
      addCurrentSelector();
      addCurrentPhase();
    }
    else{

      if(chunk.name=='splitter'){
        addCurrentSelector();
      }

      addChunkToSelector(chunk, currentSelector);

    }
  })

  addCurrentSelector();
  addCurrentPhase();

  return phases;
}



