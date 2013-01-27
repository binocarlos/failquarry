/*
 * @class 		server.rpc
 * @extends 	server
 * @filename   	server/rpc.js
 * @package    	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry rpc server - uses dnode to listen for requests
 *
 * not a public facing thing - these are internal servers
 *
 */

define([

	// the base class
	'./server',
	
	'dnode',
	
	'upnode'
	
], function(

	// the base class
	server,
	
	dnode,
	
	upnode
	
) {
	
	return server.extend(
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
		
		/**
		 * http server config
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('server.rpc');

			return ret;
			
		},
		
		buildServer: function() {
			
			return upnode(this.api());
			
		},

		/*
		 * an object containing the public api for this server
		 */		
		api: function() {
		
			// test client
			return function (client, conn) {
    			this.timesX = function (n,f) {
        			client.x(function (x) {
            			f(n * x);
        			});
    			}; 
			}
			
		}
		
	});
	
});