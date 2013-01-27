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
