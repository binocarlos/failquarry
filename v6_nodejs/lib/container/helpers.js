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