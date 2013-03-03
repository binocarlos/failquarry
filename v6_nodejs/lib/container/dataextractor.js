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
var xml = require('./filters/xml');
var utils = require('../utils');

var eyes = require('eyes');

module.exports = extract;

/*
  Quarry.io - Container Args
  --------------------------

  Converts the arguments into container.new into proper container data

 */

function process_string(arg){
  // XML string
  if(arg.match(/^\s*</)){
    return xml.fromXML(arg);
  }
  // JSON string
  else if(arg.match(/^[\[\{]/)){
    return JSON.parse(arg);
  }
  else{
    return [{
      meta:{
        tagname:arg
      }
    }]
  }
}

function extract(args, basemodel){

  args = _.isArray(args) ? args : (args ? [args] : []);

  args = _.filter(args, function(arg){
    return !_.isEmpty(arg);
  })

  var model_data = [];

  // tagname, attr
  if(_.isString(args[0]) && _.isObject(args[1])){
    var single_data = {
      meta:{
        tagname:args[0]
      },
      attr:args[1]
    }
    model_data = [single_data];
  }
  // xml/json string
  else if(_.isString(args[0])){
    model_data = process_string(args[0]);
  }
  else if(_.isArray(args[0])){
    model_data = args[0];
  }
  else if(_.isObject(args[0])){
    model_data = [args[0]];
  }
 
  model_data = _.map(model_data, function(containerdata){
    // if it is a backbone model - lets check if it's attributes or
    // the higher level wrapper
    if(containerdata && containerdata.cid){
      
      // we are already a wrapper model just return
      if(containerdata._is_quarry_wrapper){
        return containerdata;
      }
      else{
        var ret = new basemodel();
        ret.attr = containerdata;
        return ret;
      }
      
    }
    else{
      return new basemodel(containerdata);
    }
  })

  return model_data;

 /*
  var tagname = null;
  var single_data = {};
  var model_data = null;

  console.log('-------------------------------------------');
  console.log('data in');
  console.dir(args);

  function processobject(arg){
    return arg.cid ? arg : utils.extend(true, single_data, {
      'attr':arg
    })
  }

  function processarg(arg){
    if(!arg){
      return;
    }

    if(_.isArray(arg)){
      model_data = _.map(arg, processobject);
    }
    else if(_.isString(arg)){
      var processed = process_string(arg);
      if(processed){
        model_data = processed;
      }
      else{
        tagname = arg;
      }
    }
    else if(_.isObject(arg)){
      single_data = processobject(arg);
    }
  }

  if(args.length<=0){
    model_data = []
  }
  else{
    processarg(args[0]);
    processarg(args[1]);
  }

  if(single_data && tagname){
    single_data.meta || (single_data.meta = {});
    single_data.meta.tagname = tagname;
  }

  if(model_data==null){
    model_data = [single_data];
  }

  if(!_.isArray(model_data)){
    model_data = model_data ? [model_data] : [];
  }

  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  console.log('data out');
  console.dir(model_data);
  return model_data;
  */
}