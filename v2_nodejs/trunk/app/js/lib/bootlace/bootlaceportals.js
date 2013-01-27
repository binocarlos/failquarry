/*
 * @class bootlace
 * @filename   	bootlace/index.js
 * @package    	bootlace
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * a nice wrapper for base that gives a setup control flow
 *
 * 
 *
 */

define([

	'bootlace',
	
	'underscore',
	
	'async',
	
	'system'
	
], function(

	base,
	
	_,
	
	async,
	
	systemClass

) {
	
	var system = systemClass.instance();
	
	return base.extend(
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
		 * get the functions to perform the setup
		 *
		 */
		getObjectSetupFunctions: function() {
			
			var ret = this._super();
			
			var bootlace = this;
			
			// create the portals for this object if they have requested any
			// this can be in the config (in the portals namespace)
			// or from the overriden object method
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				bootlace.createPortals(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * added to by subclasses
		 *
		 */
		getPortals: function() {
			
			return [];
			
		},
		
		/**
		 * setup the listening portals
		 *
		 */
		createPortals: function(finishedCallback) {
			
			var bootlace = this;
			
			var portals = this.getPortals();
			
			// no portals from the config
			if(portals.length<=0) {
				finishedCallback();	
				return;
			}
			
			var switchboard = system.switchboard();
			
			bootlace.message('header', 'Loading Portals for ' + this.name);
			
			async.forEachSeries(portals, function(portal, nextPortalCallback) {
				
				switchboard.addPortal(portal, nextPortalCallback);
				
				
			}, function(error) {
				
				finishedCallback(error);
				
			});
			
		},
		
		/**
		 * portal factory
		 *
		 */
		createPortal: function(config) {
			
			var switchboard = system.switchboard();
			
			return switchboard.createPortal(config);
		}
		
	});
	
});