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
	
	var servers = {
		webserver:{
			path:'server/http/webserver',
			cluster:true
		},
		reception:{
			path:'server/http/reception',
			cluster:false
		},
		registry:{
			path:'server/rpc/registry',
			cluster:false
		},
		quarryscript:{
			path:'server/rpc/quarryscript',
			cluster:false
		}
	};
	
	var server = servers[process.env.QUARRY_SERVER];
	
	clusterboot(!dev && server.cluster, function() {
	
		// bootstrap the system with the config
		require(['system'], function(systemClass) {
			
			// the system is ALWAYS booted first
			var system = systemClass.instance({
				silent:!dev,
				development:dev
			});
			
			system.bind('ready', function() {
			
				system.message('init', 'Boostrapping ' + server.path);
				
				system.runServer(server.path, {
				
					
					
				});
				
			});
			
		});
		
		
	});
	

});