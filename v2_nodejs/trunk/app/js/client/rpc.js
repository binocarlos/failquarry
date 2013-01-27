/**
 * @class jquarry.client.rpc
 * @filename   	jquarry/client/rpc.js
 * @package    	core
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry rpc level client
 *
 */

define([

	'./client',
	
	'underscore',
	
	'system',
	
	'async',
	
	'dnode',
	
	'upnode'
	
	
	
], function(

	client,
	
	_,
	
	systemClass,
	
	async,
	
	dnode,
	
	upnode
	
) {
	
	var system = systemClass.instance();
	
	return client.extend(
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
		name: 'rpc client',
		
		// a reference to the rpc connection
		_connection: null,
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			// we are loading the server configs because we want to know how to connect to them innit
			ret.push('server.rpc');

			return ret;
			
		},
		
		/**
		 * setup up the registry server object
		 *
		 */
		getObjectSetupFunctions: function() {
			
			// get the base setup functions
			var ret = this._super();
			
			var client = this;
			
			// load the website registry server
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				client.setupConnection(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * setup the website registry
		 *
		 */
		setupConnection: function(callback) {
			
			var client = this;
			
			this.message('header', 'Creating RPC Connection');
			this.message('event', 'port', this.config('port'));
			
			// we do this so if a reconnection is made we don't trigger the setup again
			var onceOnlyCallback = false;
			
			// use the upnode connection
			upnode.connect(this.config('port'), function(remote, conn) {
			
				client._connection = remote;
				
				if(!onceOnlyCallback) {
					onceOnlyCallback = true;
					callback();
				}
			});
			
			/*
			dnode.connect(this.config('port'), function (remote) {
				
				client._connection = remote;
				
				async.nextTick(function() { callback(); });
				
			});
			*/
			
		}
	
		
	});
	
});