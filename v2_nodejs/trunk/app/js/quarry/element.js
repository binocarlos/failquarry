/*
 * @class quarry.element
 * @extends base
 * @filename   	quarry/element.js
 * @package    	quarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * Element
 *
 * 
 * 
 *
 */

define([

	'base',
	
	'underscore',
	
	'async',
	
	'robject'
	
	
], function(

	base,
	
	_,
	
	async,
	
	robject
	
) {
	
	var elementClass = base.extend({
		factory: function(data) {
			return new this.prototype.constructor(data);
		}
	},{
		_data:null,
		
		init:function(data) {
			this._data = robject.factory(data);
		}
	});
	
	return elementClass;
	
});