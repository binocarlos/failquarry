/*
 * @class 		registry.broker
 * @singleton
 * @filename   	registry/broker.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * front end for the different registries
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'bootlaceportals',
	
	'system',
	
	'async'
	
], function(

	_,
	
	bootlace,
	
	systemClass,
	
	async
	
) {
	
	return bootlace.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		
		
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		name: 'base registry',
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('registry');

			return ret;
			
		}
		
	});
	
});