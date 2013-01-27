/*
 * @filename   	jquarry/bootstrap/webserver.js
 * @package    	bootstrap
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry require.js webserver bootstrap
 *
 */

require([

	// include the main paths first
	'./boot',
	
	'./clusterboot'
	
	
], function(

	boot,
	
	clusterboot
	
) {

	// the one flag
	var dev = process.env.NODE_ENV=='development';

	clusterboot(!dev && server.cluster, function() {
	
		// bootstrap the system with the config
		require(['system'], function(systemClass) {
			
			// the system is ALWAYS booted first
			var system = systemClass.instance({
				silent:!dev,
				development:dev
			});
			
			system.bind('ready', function() {
			
				require(['quarry'], function($quarry) {
					
					$quarry('website:/folder.big[name$=h][modified!=recent]:hello > file.image, *, facebook:/friend[name^=k] gallery photo, product.onsale[price<100]:mod', function(results) {
						
					});
					
				});
				
			});
			
		});
		
		
	});
	

});