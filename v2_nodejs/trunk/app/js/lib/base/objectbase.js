/*
 * @class JQuarry.Base
 * @filename   	lib/database.js
 * @package    	core
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * slightly enhanced base class that has one data object that is wrapped with the class
 *
 */

define([

	'./base',
	
	'robject'
	
], function(

	baseClass,
	
	robject
	
) {
	
	// our base class is an events emitter
	return baseClass.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		
		/*
		 * @static
		 * generic factory to make a new instance of the given class
	  	 */
		factory: function(rawData) {
			
			return new this.prototype.constructor(rawData);
			
		}
	
	}, 
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		/*
		 * the raw data property
		 */
		_data:{},
		
		init:function(rawData) {
			this._data = robject.factory(rawData);
			this.process();
		},
		
		process:function() {
			
		},
		
		rawData:function() {
			return this._data.rawData();
		},
		
		get:function(field) {
			return this._data.get(field);
		},
		
		set:function(field, val) {
			return this._data.set(field, val);
		},
		
		replace:function(replaceWith) {
			this._data.replace(replaceWith.rawData());	
		}
	});
	
	return base;
	
});