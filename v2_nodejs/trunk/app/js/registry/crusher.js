/*
 * @class 		registry.crusher
 * @singleton
 * @filename   	registry/crusher.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * crusher registry - looks after optimizing the codebase into files - issues a filewatch to delete them as the code changes
 *
 * 
 *
 *
 */

define([

	'./registry',
	
	'underscore',
	
	'async',
	
	'system',
	
	'crusher',
	
	'watch'
	
	
], function(

	baseClass,
	
	_,
	
	async,
	
	systemClass,
	
	crusherClass,
	
	watch
	
	
) {
	
	var system = systemClass.instance();
	
	var registryInstance = null;
	// the singleton bootstrap for the server system
	function bootstrapRegistry()
	{
		 return {
	        instance: function () { 
	        	return registryInstance!=null ? registryInstance : registryInstance = new theRegistryClass();
	        }
	    };
	}
	
	var theRegistryClass = baseClass.extend(
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
		name: 'crusher registry',
		
		/**
		 * a map of currently crushed files onto a function to remove the associated module from the cache
		 * if a filepath changes that is in this cache - it will run the function
		 *
		 */
		_crushedfiles:{},
		
		/**
		 * the crusher script proxy (it runs as an external require.js optimizer process)
		 *
		 */
		_crusher:null,
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('registry.crusher');

			return ret;
		},
		
		/**
		 * load the websites
		 *
		 */
		getObjectSetupFunctions: function() {
			
			var ret = this._super();
			var registry = this;
			
			ret.push(function(callback) {
				
				// setup the crusher
				registry.loadCrusher(callback);
				
			});
			
			ret.push(function(callback) {
				
				// setup the file tree watcher
				registry.loadWatcher(callback);
				
			});
			
			return ret;
		},
		
		/*
		 * load the crusher proxy
		 */
		loadCrusher: function(finishedCallback) {
			
			var registry = this;
			
			this.message('header', 'Loading Crusher');
			
			registry._crusher = crusherClass.factory();
			
			finishedCallback();
			
		},
		
		/*
		 * watch the source code tree so if anything changes we can delete the cached
		 * crusher output
		 */
		loadWatcher: function(finishedCallback) {
			var registry = this;
			
			this.message('header', 'Loading Crusher File Monitor');
			
			var codeLocation = system.resolvePath('root:/trunk/app/js');
			
			// upon boot we want to remove all cached crusher files - we don't know what has changed
			// since we were last running
			this.message('header', 'Clearing Crusher Cache');
			
			system.resetDir('crusher', function() {
			
				watch.watchTree(codeLocation, function (f, curr, prev) {
				    if (typeof f == "object" && prev === null && curr === null) {
				     	// Finished walking the tree
				    } else if (prev === null) {
				      	// f is a new file
				      	//registry.message('flash', 'Crusher New File', f);
				    } else if (curr.nlink === 0) {
				      	// f was removed
						//registry.message('flash', 'Crusher Delete File', f);
				    } else {
						// f was changed
						//registry.message('flash', 'Crusher Modify File', f);
				    }
				    
				    registry.filePathModified(f, function() {
				    	
				    });
			  	});
			  	
				finishedCallback();
				
			});
		},
		
		removeCachePaths: function(paths, removedCallback) {
			var registry = this;
			
			_.forEach(paths, function(path) {
				delete(registry._crushedfiles[path]);	
			});
			
			removedCallback();
		},
		
		addCachePaths: function(paths, removeFunction, addedCallback) {
			var registry = this;
			
			_.forEach(paths, function(path) {
				registry._crushedfiles[path] = removeFunction;
			});
			
			addedCallback();
		},
		
		filePathModified: function(path, finishedCallback) {
			var registry = this;
			var removeFunction = registry._crushedfiles[path];
			
			if(!removeFunction) {
				finishedCallback();
				return;
			}
			
			removeFunction(finishedCallback);
		},
		
		/*
		 * load the crusher proxy
		 */
		crush: function(module, crushedCallback) {
			
			var registry = this;
			
			this.message('flash', 'Crushing', module);
			
			registry._crusher.crush(module, function(error, results) {
				
				if(error) {
					crushedCallback(error);
					return;
				}
				
				var fullPath = results.path;
				var scriptOutput = results.stdout;
				
				// now analyze the script output so we know it has changed
				// we add the file paths to the registry so if we get a file changed
				// message on that path we delete the output
				var scriptParts = scriptOutput.split("\n");
				var adding = false;
				var paths = [];
				
				_.forEach(scriptParts, function(part) {
					
					if(adding && part.match(/\w/)) {
						paths.push(part);
					}
					// look for the delimeter below which the actual file paths live
					if(part.match(/^-/)) {
						adding = true;
					}
					
				});
				
				// create the function that will delete a) the crushed file and b) the registry cache entries
				var deleteFunction = function(deletedCallback) {
					
					registry.message('flash', 'Crusher Remove', module);
					
					// first delete the crushed file contents
					registry._crusher.remove(module, function() {
					
						// now loop through each of the associated file keys and remove them from the registry
						registry.removeCachePaths(paths, deletedCallback);
						
					});
				};
				
				// now save the filepaths we have crushed into the registry so a file change
				// can be picked up
				registry.addCachePaths(paths, deleteFunction, function() {
					
					// return - we are all crushed
					crushedCallback();
				});
				
			});
			
		}
		
	});
	
	return bootstrapRegistry();
	
});