/*
 * @class system.server.component - a server side component (which can do a bit more - i.e. proper ronfigs not just robject config)
 * @extends base
 * @filename   	jquarry/component.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * server side component base class - this is a component but will do a bit more on init
 * 
 * 
 *
 */

define([

	'quarry/component',
	
	'underscore',
	
	'async',
	
	'system',
	
	'ronfig',
	
	'config'
	
	
], function(

	baseComponentClass,
	
	_,
	
	async,
	
	systemClass,
	
	ronfig,
	
	config
	
) {
	
	var system = systemClass.instance();
	
	return baseComponentClass.extend({
		
		
	}, {
		
		/**
		 * if you pass options.orm then that is used as the config object
		 * this lets you save things on the component's orm which will trigger
		 * a config update
		 *
		 */
		_orm:null,
		
		/**
		 * get a list of the config files used by this component
		 *
		 */
		getConfigFiles: function(passedConfig) {
			
			var ret = [
			
				// the base component
				config.filePath('component'),
				
				// the base component type
				config.filePath('component.' + this.type()),
				
				// the config passed from the outside
				passedConfig
			
			];
			
			return ret;
		},
		
		/**
		 * a server component will load the location from the passed config and check
		 * if there is a config.js once the system configs have been loaded
		 *
		 */
		setupComponent: function(options, readyCallback) {
			
			// assign the orm if we have one
			this._orm = options.orm!=null ? options.orm : null;

			var configObject = options.config;
			
			var component = this;
			
			// fix the location and load the config
			async.series([
			
				// construct the config based from the system config files
				function(cb) { 
					
					ronfig.factory(component.getConfigFiles(configObject), function(error, config) {
					
						component._config = config;
						
						cb();
						
					});
					
				},
				
				// calculate the path and resolve where it points to
				function(cb) { 
					
					component.resolveLocation(cb);
					
				},
				
				// now we know the location, we can check to see if we have a config file in it
				function(cb) { 
					
					component.finalizeConfig(cb);
					
				}
				
				
			], function(err) {
			
				readyCallback(err, component);
				
			});			
		},
		
		/**
		 * work out where this components physical location is
		 *
		 */
		resolveLocation: function(finishedCallback) {
			
			this._location = system.resolvePath(this._path);
			
			async.nextTick(function() { finishedCallback(); });
			
		},
		
			
			
		/**
		 * now we know the physical location of the component - we can check to see if there is a config file
		 * in that location
		 *
		 */
		finalizeConfig: function(finishedCallback) {
			
			var component = this;
			
			var configJsonPath = component.location('config.json');
			
			var addConfigs = [];
			
			// now we want to check to see if there is a config.json in the location
			// for the component
			system.fileExists(configJsonPath, function(configJsonExists) {
				
				if(configJsonExists) {
					addConfigs.push(configJsonPath);
				}
				
				// do we have anything else to add to the config?
				if(addConfigs.length>0) {
					component._config.addThings(addConfigs, finishedCallback);
				}
				else {
					async.nextTick(function() { finishedCallback(); });
				}
				
			});
			
		},
		
		/*
		 * the config wants rebuilding because stuff has changed
		 */
		rebuildConfig: function() {
			this._config.rebuild();
		},
		
		/*
		 * grab the orm for this component
		 */
		setORM: function(orm) {
			return this._orm = orm;
		},
		
		/*
		 * grab the orm for this component
		 */
		orm: function(field) {			
			return this._orm[field];
		},
		
		id: function() {
			return this.orm('id');	
		},
		
		name: function() {
			return this.orm('name');	
		}
		
		
	});
	
});