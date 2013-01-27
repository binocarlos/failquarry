/*
 * @filename   	jquarry/bootstrap/client.js
 * @package    	bootstrap
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * client bootstrap - run in browser
 *
 */

require([

	// include the main paths first
	'./include'
	
	
], function(

	include
	
) {
	
	include.run();
	
	// bootstrap the system with the config
	require(['system'], function(systemClass) {
		// the system is ALWAYS booted first
		var system = systemClass.instance({
			silent:true
		});
		
		console.log(system);
	});

});