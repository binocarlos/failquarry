/**
 * @class jquarry.client
 * @filename   	jquarry/client/client.js
 * @package    	core
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry base level client
 *
 */

define([

	'underscore',
	
	'bootlace',
	
	'system',
	
	'async'
	
	
	
], function(

	_,
	
	bootlace,
	
	systemClass,
	
	async
	
) {
	
	var system = systemClass.instance();
	
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
		name: 'default client',
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			// we are loading the server configs because we want to know how to connect to them innit
			ret.push('server');

			return ret;
			
		},
		
		/**
		 * proxy to the system
		 */
		message: function(type, title, text) {
			
			system.message(type, title, text);
			
		}
		 
	
		
	});
	
});