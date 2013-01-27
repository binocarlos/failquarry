/*
 * @class 		server.rpc.accountregistry
 * @extends 	server.rpc
 * @filename   	server/rpc/accountregistry.js
 * @package    	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry account registry rpc server
 *
 */

define([

	// the base class
	'../rpc',
	
	'async',
	
	'registry/query',
	
	'system'
	
	
], function(

	// the base class
	rpc,
	
	async,

	queryFactory,
	
	systemClass
	
) {
	
	var system = systemClass.instance();
	
	return rpc.extend(
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
		name:'Registry Server',
		
		_broker:null,
		
		/**
		 * http server config
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('server.rpc.registry');

			return ret;
			
		},
		
		/**
		 * setup up the registry server object
		 *
		 */
		getObjectSetupFunctions: function() {
			
			// get the base setup functions
			var ret = this._super();
			
			var server = this;
			
			// load the registry broker
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				server.setupRegistry(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * setup the website registry
		 *
		 */
		setupRegistry: function(finishedCallback) {
			
			var server = this;
			
			this.message('header', 'Loading Registry');
			
			require(['registry'], function(registryClass) {
				
				var broker = registryClass.instance();
				
				broker.bind('ready', function() {
					
					server._broker = broker;
					
					finishedCallback();
					
				});
				
			});
			
		},
		
		/**
		 * get the registry
		 *
		 */
		broker: function(which) {
			
			return which==null ? this._broker : this._broker.get(which);
			
		},
		
		/*
		 * an object containing the public api for this server
		 */		
		api: function() {
		
			var server = this;
			
			// the client is passed here
			return function (client, conn) {
				
				/*
				 * run a registry query passed raw over the network
				 */
				this.runQuery = function(queryName, options, callback) {
					
					system.message('flash', 'Registry Request', queryName);
					system.log(options);
					
					queryFactory(server._broker, queryName, options, function(error, result) {
						callback(result);	
					});
					
				};
				
			};
			
		}
		
	});
	
});