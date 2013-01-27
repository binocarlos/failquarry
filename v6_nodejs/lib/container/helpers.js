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
var eyes = require('eyes');

/*
  Quarry.io - Container Helpers
  -----------------------------


 */

module.exports.property = property;
module.exports.model = model;
module.exports.object = object;
module.exports.fn = fn;

/*


  Helpers



 */


/*
  Accessor for a single function that will return either an array or single value

 */
function fn(name){
  return function(){
    var args = _.toArray(arguments);
    var ret = this.models.map(function(model){
      return model[name].apply(model, args);
    })
    return this.models.length==1 ? (args.length>0 ? this : ret[0]) : ret;
  }
}

/*
  Accessor for a single property within the top-level backbone model

 */
function property(name){
  return function(){
    var args = arguments;
    if(args.length>0){
      this.models.each(function(model){
        model.set(name, args[0]);
      })
      return this;
    }
    else{
      return this.models.length > 0 ? this.get(0).get(name) : null;
    }
  }
}

/*
  Accessor for a model within the base backbone model (like attr)

 */
function model(name){
  return function(){
    var args = arguments;

    if(args.length>0){

      if(args.length==1 && _.isString(args[0])){
        return this.models.length > 0 ? this.get(0)[name].get(args[0]) : null;
      }
      else if(args.length==1 && _.isObject(args[0])){
        this.models.each(function(model){
          var usemodel = model[name];
          
          usemodel.set(args[0]);
        })
      }
      else if(args.length==2){
        var setdata = {};
        setdata[args[0]] = args[1];
        this.models.each(function(model){
          var usemodel = model[name];
          usemodel.set(setdata);
        })
      }
      
      return this;
    }
    else{
      return this.models.length > 0 ? this.get(0)[name].toJSON() : null;
    }
  }
}

/*
  Accessor for an object within the base model (like _meta)

 */
function object(name){
  return function(){
    var args = arguments;
    if(args.length<=0){
      return this.models.length > 0 ? this.get(0).get(name) : null;
    }
    else if(args.length==1){
      if(_.isObject(args[0])){
        var setdata = {};
        _.each(args[0], function(v, k){
          setdata[name + '.' + k] = v;
        })
        this.models.each(function(model){
          model.set(setdata);
        })
        return this;
      }
      else{
        return this.models.length > 0 ? this.get(0).get(name + '.' + args[0]) : null;
      }
    }
    else if(args.length==2){
      var setdata = {};
      setdata[name + '.' + args[0]] = args[1];
      this.models.each(function(model){
        model.set(setdata);
      })
      return this;
    }
  }
}