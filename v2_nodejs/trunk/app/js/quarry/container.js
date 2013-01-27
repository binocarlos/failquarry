/*
 * @class quarry.container
 * @extends base
 * @filename   	quarry/container.js
 * @package    	quarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * Element container
 *
 * 
 * 
 *
 */

define([

	'base',
	
	'underscore',
	
	'async',
	
	'./element'
	
	
], function(

	base,
	
	_,
	
	async,
	
	elementClass
	
) {
	
	var containerClass = base.extend({
		factory: function() {	
			return new this.prototype.constructor();
		}
	},{
		
		_filled:false,
		
		_promises:[],
		_elements:[],
		
		init:function() {
			
		},
		
		elements: function() {
			return this._elements;
		},
		
		filled: function() {
			return this._filled;
		},
		
		addElement: function(element) {
			this._elements.push(element);
		},
		
		promise: function(promiseFunction) {
			var container = this;
			if(container._filled) {
				container.doPromise(promiseFunction);
				return;
			}
			
			container._promises.push(promiseFunction);
			
			return this;
		},
		
		fill: function(data) {
			var container = this;
			
			if(!_.isArray(data)) {
				data = [data];
			}
			
			this._elements = data;
			
			_.forEach(container._promises, function(promise) {
				container.doPromise(promise);
			});
			
			container._promises = [];
			this._filled = true;
			
			return container;
		},
		
		doPromise: function(promiseFunction) {
			promiseFunction.apply({}, []);
		},
		
		pourInto: function(filling) {
			var pouring = this;
			
			_.forEach(pouring.elements(), function(element) {
				filling.addElement(element);
			});
		},
		
		each: function(eachFunction) {
			
			var container = this;
			
			return container.promise(function() {
				_.forEach(container._elements, function(element) {
					eachFunction.apply(element, [element]);
				});
			});
		}
	});
	
	return containerClass;
	
});