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
var xml = require('xmldom');
var eyes = require('eyes');

module.exports.fromXML = fromXML;
module.exports.toXML = toXML;

/*
  Quarry.io - Container XML
  -------------------------

  Knows how to turn an XML string into containers and containers into an XML string


 */

function null_filter(val){
  return !_.isUndefined(val) && !_.isNull(val);
}

function data_factory(element){

  if(element.nodeType!=element.ELEMENT_NODE){
    return;
  }

  var metafields = {
    id:true,
    quarryid:true
  }
  
  var manualfields = {
    tagname:true,
    routes:true,
    class:true
  }

  var routes_string = element.getAttribute('routes');

  if(!routes_string.match(/^\{/)){
    routes_string = '{}';
  }

  routes_string = routes_string.replace(/'/g, '"');

  var data = {
    attr:{},
    meta:{
      tagname:element.nodeName,
      classnames:element.getAttribute('class').split(/\s+/)
    },
    routes:JSON.parse(routes_string),
    children:[]
  }
  
  _.each(metafields, function(v, metafield){
    data.meta[metafield] = element.getAttribute(metafield)
  })

  _.each(element.attributes, function(attr){
    if(!metafields[attr.name] && !manualfields[attr.name]){
      data.attr[attr.name] = attr.value;
    }
  })

  data.children = _.filter(_.map(element.childNodes, data_factory), null_filter);

  return data;
}

function fromXML(string){

  var DOMParser = xml.DOMParser;

  var doc = new DOMParser().parseFromString(string);
  
  return _.map(doc.childNodes, data_factory);
}


function string_factory(data, depth){

  var meta = data.meta || {};
  var routes = data.routes || {};
  var attr = data.attr || {};

  function get_indent_string(){
    var st = "\t";
    var ret = '';
    for(var i=0; i<depth; i++){
      ret += st;
    }
    return ret;
  }

  var pairs = {
    id:meta.id,
    quarryid:meta.quarryid,
    routes:JSON.stringify(routes).replace(/"/g, "'"),
    class:_.isArray(meta.classnames) ? meta.classnames.join(' ') : ''
  }

  var pair_strings = [];

  _.each(attr, function(val, key){
    pairs[key] = _.isString(val) ? val : '' + val;
  })

  _.each(pairs, function(value, field){
    if(!_.isEmpty(value)){
      pair_strings.push(field + '="' + value + '"');  
    }
  })

  if(data.children && data.children.length>0){
    var ret = get_indent_string() + '<' + meta.tagname + ' ' + pair_strings.join(' ') + '>' + "\n";

    _.each(data.children, function(child){      
      ret += string_factory(child, depth+1);
    })

    ret += get_indent_string() + '</' + meta.tagname + '>' + "\n";

    return ret;    
  }
  else{
    return get_indent_string() + '<' + meta.tagname + ' ' + pair_strings.join(' ') + ' />' + "\n";
  }
}

/*
  This is the sync version of a warehouse search used by in-memory container 'find' commands

  The packet will be either a straight select or a contract
 */
function toXML(data_array){
  return _.map(data_array, function(data){
    return string_factory(data, 0);
  }).join("\n");
}