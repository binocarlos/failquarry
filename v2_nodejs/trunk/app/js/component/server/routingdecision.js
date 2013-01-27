/**
 * @class 		component.server.routingdecision
 * @singleton
 * @filename   	component/server/routingdecision.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * wrapper for a robject that knows about the properties relating to a router decision
 *
 * 
 *
 *
 */



define([

	'base/objectbase',
	
	'underscore',
	
	'system'
	
], function(

	baseClass,
	
	_,
	
	systemClass
	
) {
	
	var system = systemClass.instance();
	
	// our base class is an events emitter
	return baseClass.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		
		redirect: function(location) {
			return {
				type:'redirect',
				location:location
			};
		},
		
		redirectHome: function() {
			return {
				type:'redirect',
				location:system.domain()
			};
		}
		
		
	}, 
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		
		/*
		installation_id: function() {
			return this.get('installation_id');
		},
		
		component_id: function() {
			return this.get('component_id');
		},
		
		component: function() {
			return this.get('component');
		},
		
		website_id: function() {
			return this.get('website_id');
		},
		
		file: function() {
			return this.get('file');
		},
		
		// should we process the contents of this routing decision for quarry script?
		parse_quarry_script: function() {
			return this.get('parse_quarry_mode')!=null;
		},
		
		parse_quarry_mode: function() {
			return this.get('parse_quarry_mode');
		},
		
		ext: function() {
			if(!this.file().match(/\./)) { return ''; }
			return this.file().split('.').pop().toLowerCase();	
		},
		
		hasComponent: function() {
			return !_.isEmpty(this.component_id());
		},
		
		hasFile: function() {
			return !_.isEmpty(this.file());
		}
		*/
		
	});
	
	return base;
	
});