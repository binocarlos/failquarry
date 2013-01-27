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
