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
    
/*
  Quarry.io Pigeon Hole
  ---------------------

  Useful accessor/setter for a deep nested object

 */

module.exports = pigeonhole;


/**
 * Setups a deep nested object get/setter on the given property of the host object
 */

function pigeonhole(data, delimeter){

	var self = this;

	if(_.isEmpty(data)){
		data = {};
	}
	if(_.isEmpty(delimeter)){
		delimeter = '.';
	}

	

	function accessor(obj, field, value){
		var hasValue = !_.isUndefined(value);

		// this means they want the whole data
		if(_.isEmpty(field)){
			return obj;
		}

		// this means they are setting multiple keys
		if(_.isObject(field)){
			_.each(field, function(val, f){
				accessor(obj, f, val);
			});
			return field;
		}
		// this means the field has multiple levels
		else if(field.indexOf(delimeter)>0){
			var parts = field.split(delimeter);
			var first = parts.shift();

			// the array accessor wants an integer key otherwise we can't do nuffink
			if(_.isArray(obj)){
				first = parseInt(first);

				if(isNaN(first)){
					return null;
				}
			}

			if(obj[first]){
				return accessor(obj[first], parts.join(delimeter), value);
			}
			// make space because we are writing deep
			else if(hasValue){
				obj[first] = {};
				return accessor(obj[first], parts.join(delimeter), value);
			}
			else{
				return null;
			}
		}
		// this means we are now on the lowest level
		else{
			return hasValue ? obj[field] = value : obj[field];
		}
	}

	var changed = {};

	function api(field, value){

		if(_.isObject(field)){
			_.each(field, function(v, f){
				changed[f] = v;
			})
		}
		else if(arguments.length==2){
			changed[field] = value;
		}

		return accessor(data, field, value);
	}

	api.raw = function(){
		return data;
	}

	api.replace = function(d){
		data = d;
		return this;
	}

	api.reset = function(){
		changed = {};
	}

	// returns an object of the changed properties
	// or null if nothing has changed
	api.changed = function(){
		return changed;
	}

	return api;
}
