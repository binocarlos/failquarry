/**
 * @class jquarry.component
 * @extends base
 * @filename   	jquarry/component.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * component base class
 *
 * a component is a directory that contains some files
 * it uses a file-based element to access the file-system which means you can use quarry selectors
 * for the files inside of a component
 * 
 * 
 *
 */

define([

	'../component',
	
	'underscore',
	
	'async',
	
	'jahmerge',
	
	'robject',
	
	'system',
	
	'./server/routingdecision',
	
	'config'
	
	
], function(

	base,
	
	_,
	
	async,
	
	jahmerge,
	
	robject,
	
	systemClass,
	
	routingDecision,
	
	configLoader
	
) {
	
	var system = systemClass.instance();
	
	var configCache = {};
	
	return base.extend({
		
	
		
	}, {
		
		/*
		 * setup the component - called from the factory (to give things a chance to settle) trigger ready when done
		 */
		setupComponent: function() {
			
			var component = this;
			
			this.loadConfig(function() {
				component.trigger('ready');
			});
		},
		
		/**
		 * loads the cascading config for this system
		 *
		 */
		loadConfig: function(mainCallback) {
			
			var component = this;
			
			var foundConfig = function(config) {
				component._config = robject.factory(jahmerge(config.rawData(), component._config.rawData()));
			};
			
			if(!configCache[component.type()]) {
			
				system.message('header', 'Loading Component Config: ' + component.type());
			
				system.configFactory(component.getConfigFiles(), function(error, config) {
					
					var flat = config.flatten();
					
					configCache[component.type()] = flat;
					
					foundConfig(flat);
					
					mainCallback();
				});
			} else {
				foundConfig(configCache[component.type()]);
				
				mainCallback();
					
			}
			
		},
		
		getConfigFiles: function() {
			
			return ['component', 'component.server'];
			
		},
		
		/*
		 * tells you if the given ext should be processed for quarry script - sync
		 */
		processExtMode: function(ext) {
			return this.config('process_extensions')[ext];
		},
		
		/*
		 * match what the filepath is for the request on this website
		 */
		getRoutingDecision: function(request, returnCallback) {
			
			var component = this;
			
			var decision = {
				component_id:component.id()/*,
				component:component.freeze()*/
			};
		
			component.searchForFile(request.pathname, function(error, statInfo) {
				
				// we have not found the file in this component
				if(error || !statInfo) {
					// we just pass back the website decision above
				} 
				// we have a hit! - fill in the routing decision with the location
				else {
					decision.file = statInfo.path;
					decision.ext = statInfo.path.split('.').pop();
					
					// tell the decision if we are processing
					decision.parse_quarry_mode = component.processExtMode(decision.ext);
				}
	
				returnCallback(null, decision);
					
			});
		},
		
		/*
		 * this should come from the component config
		 */
		directoryIndex: function() {
			return this.config('directoryIndex');
		},
		
		/*
		 * find the given file path for this component - has the option to cascade
		 */
		searchForFile: function(path, callback) {
			
			var component = this;
			
			if(path.match(/\/$/)) {
				path += component.directoryIndex();
			}
			
			var aliases = component.config('aliases');
			
			// check the aliases
			async.forEachSeries(_.keys(aliases), function(alias, nextAliasCallback) {
				
				// ('/_quarry/test.jpg').indexOf('/_quarry/')
				if(path.indexOf(alias)==0) {
					
					var fullPath = system.resolvePath(aliases[alias] + (path.split(alias)[1]));
					
					component.statFile(fullPath, function(error, statInfo) {
						if(error || !statInfo) {
							nextAliasCallback();
							return;
						}
						else {
							callback(null, statInfo);	
						}
					});	
					
				} else {
					nextAliasCallback();
				}
				
			}, function() {
				// no alias has matched - lets look in the actual component directory for it
				component.statFile(component.location(path), callback);	
			});
			
		},
		
		statFile: function(fullPath, callback) {
			system.stat(fullPath, function(error, info) {
				if(error || !info) {
					callback(error);
					return;
				}
				info.path = fullPath;
				callback(null, info);	
			});
		},
		
		/*
		 * ensure the root directory for this component - optional do some copying
		 */
		ensureLocation: function(finishedCallback) {
			system.ensurePathExists(this.location(), function(error) {
						
				finishedCallback(error);
						
			});
		},
		
		/*
		 * ensure the root directory for this component - optional do some copying
		 */
		installFiles: function(finishedCallback) {
			finishedCallback();
		},
		
		/*
		 * do the setup work for this component - create directory and copy files
		 */
		install: function(finishedCallback) {
			
			var component = this;
			
			async.series([
				function(callback) {
					component.ensureLocation(callback);
				},
				
				function(callback) {
					component.installFiles(callback);
				}
			], function() {
				finishedCallback();
			});
		}
		
		
	});
	
});