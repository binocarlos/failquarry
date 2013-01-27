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

// this is the threads a go-go bootstrap for the webserver
// we wrap the whole server bootstrap into a function

define([

	'cluster',
	
	'os'
	
	
], function(

	cluster,
	
	os
	
) {
	
	/*
	 * runSingleServer is a function that represents one thread
	 * multicore is a boolean (single or multi)
	 */
	return function(multicore, serverFunction) {
		
		if(!multicore) {
			
			serverFunction();
			
		}
		else {
			
			if (cluster.isMaster) {

				var numCPUs = os.cpus().length;

				// Fork workers.
				for (var i = 0; i < numCPUs; i++) {
					
					cluster.fork();
				}
		
				cluster.on('death', function(worker) {
					cluster.fork();
				});
				
			} else {
				
				serverFunction();
			}
		}
	}
});