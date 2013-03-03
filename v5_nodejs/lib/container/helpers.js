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

/*
  Quarry.io - Attribute Wrapper
  -----------------------------

  A function that returns an accessor for a subset of container data

 */

var api = {};

module.exports = api;

// tells you if the combination of arguments involves setting or getting
//
// SET = .attr('name', 'Bob') - .attr({name:'bob'})
// GET = .attr() - .attr('name')
function is_setter(args){
  return args.length==2 || _.isObject(args[0]);
}

// run a function on a given model
function run_single_model(fn, model, args){
  var apply_fn = _.isString(fn) ? model[fn] : fn;

  return apply_fn.apply(model, args);
}

/*
  Generic factory for producing functions that look after applying the action across a list of containers
 */
api.wrapper = function(options){

  options || (options = {});

  /*
    The singular function is what's applied to each model

   */
  var singular_function = options.singular || function(){}

  return function(){
    var self = this;
    var args = _.toArray(arguments);
    var models = self.models;

    /*
      This means we are running across all models
     */
    if(!options.first && (options.all || (args.length>0 && options.property) || is_setter(args))){
      _.each(models, function(model){
        run_single_model(singular_function, model, args);
      })
      return self;
    }
    /*
      This means we are only running the first model
     */
    else{
      if(self.models.length<=0){
        return null;
      }

      return run_single_model(singular_function, self.models[0], args);      
    }
  }
}

/*
  object attribute accessor - this assumes a base path
 */
api.object_attr = function(base_field){

  return function(args){
    var self = this;
    if(args.length<=0){
      return self.get(base_field);
    }
    else{
      var field = args[0];
      var value = args[1];

      var field_path = (_.isUndefined(base_field) ? [field] : [base_field, field]).join('.');

      if(_.isString(field)){
        return self.get(field_path);
      }
      else if(_.isObject(field)){
        _.each(field, function(val, field){
          self.set(field_path, val);
        })
        return self;
      }
    }
  }
}

/*
  single attribute accessor - it is passed the container and an arguments array
 */
api.flat_attr = function(field, def){

  return function(args){

    var self = this;
    if(args.length<=0){
      return self.get(field) || def;
    }
    else{
      self.set(field, args[0]);
      return self;
    }
  }
}
