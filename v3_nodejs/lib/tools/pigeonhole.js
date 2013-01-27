/*!
 * Pigeonhole
 *
 *
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter;

/**
 * Setups a deep nested object get/setter on the given property of the host object
 */

var pigeonhole = function(data, delimeter){

	var self = this;

	if(_.isEmpty(data)){
		data = {};
	}
	if(_.isEmpty(delimeter)){
		delimeter = '.';
	}

	var accessor = function(obj, field, value){
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

	var api = function(field, value){

		if(!_.isUndefined(value)){
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

	_.extend(api, EventEmitter.prototype);

	// returns an object of the changed properties
	// or null if nothing has changed
	api.changed = function(){
		return changed;
	}

	return api;
}

exports.version = '0.0.1';

exports = module.exports = pigeonhole;
