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
	
	var registryInstance = null;
	
	function bootstrapRegistryBroker()
	{
		 return {
	        instance: function () { 
	        	return registryInstance!=null ? registryInstance : registryInstance = new theRegistryBrokerClass();
	        }
	    };
	}
	
	var system = systemClass.instance();
	
	var theRegistryBrokerClass = bootlace.extend(
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
		name: 'registry broker',
		
		registries:{},
		
		get: function(which) {
		
			return this.registries[which];
			
			
		},
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('registry');

			return ret;
			
		},
		
		/**
		 * website registry
		 *
		 */
		getObjectSetupFunctions: function() {
			
			var ret = this._super();
			var broker = this;
			
			ret.push(function(callback) {
				
				// setup the website registry
				broker.setupAccountsRegistry(callback);
				
			});
			
			ret.push(function(callback) {
				
				// setup the crusher registry
				broker.setupCrusherRegistry(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * setup the website registry
		 *
		 */
		setupAccountsRegistry: function(finishedCallback) {
			
			var broker = this;
			
			this.message('header', 'Loading Accounts Registry');
			
			require(['registry/accounts'], function(websiteRegistryClass) {
				
				var accountsRegistry = websiteRegistryClass.instance();
				
				accountsRegistry.bind('ready', function() {
				
					broker.registries['accounts'] = accountsRegistry
					
					finishedCallback();
					
				});
				
			});
			
		},
		
		/**
		 * setup the crusher registry
		 *
		 */
		setupCrusherRegistry: function(finishedCallback) {
			
			var broker = this;
			
			this.message('header', 'Loading Crusher Registry');
			
			require(['registry/crusher'], function(crusherRegistryClass) {
				
				var crusherRegistry = crusherRegistryClass.instance();
				
				crusherRegistry.bind('ready', function() {
				
					broker.registries['crusher'] = crusherRegistry
					
					finishedCallback();
					
				});
				
			});
			
		},
		
		/**
		 * base registry broker portal for admin events
		 *
		 */
		getPortals: function() {
			
			var registry = this;
			var ret = this._super();
			
			var adminListenPortal = this.createPortal({
				name:'Registry Broker Admin Listen Portal',
				exchange:'admin',
				// we want all admin messages - the middleware will filter them
				router:'#'
			});
			
			ret.push(adminListenPortal);
			
			adminListenPortal.use(function(message, next) {
			
				system.log('have message');
				
				/*
				if(message.instruction=='clearWebsiteCache') {
				
					registry.clearWebsiteCache();
					
				}
				*/
				
				next();
				
			});
			
			return ret;
			
		}
		
		
	
		
	});
	
	return bootstrapRegistryBroker();
	
});