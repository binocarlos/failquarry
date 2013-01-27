/*
 * @class system.client
 * @filename   	system/client.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * client system - knows how to do the colonel stuff from the browser
 *
 */

define([

	'base'
	
], function(

	base
	
) {
	
	// the singleton bootstrap for the server system
	function bootstrapSystem()
	{
		var _instance;
		
		 return {
	        instance: function (options) {
	        
	        	 if(_instance==null) {
	        	 	
	        	 	_instance = new theSystemClass(options);
	        	 	
	        	 }
	        	 
	        	 return _instance;
	        	
	        }
	    };
	}
	
	var theSystemClass =  base.extend(
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
		factory: function(config) {
			
			return new this.prototype.constructor(config);
			
		}
		
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		
		mode:'client',
		
		name:'Client System',
		
		init: function() {
			console.log('This is the client system');	
		}
	
		
	});
	
	return bootstrapSystem();
	
});