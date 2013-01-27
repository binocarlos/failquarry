/**
 * @class 		quarryscript.sandbox
 * @filename   	quarryscript/sandbox.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * 
 * the sandbox used to run user scripts
 *
 * this is what is loaded into the threads a gogo thread
 * 
 *
 *
 */

define([

	'base',
	
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
	
	return base.extend({
		
		/*
		 * @static
		 * generic factory to make a new instance of the given class
	  	 */
		factory: function() {
			
			return new this.prototype.constructor();
			
		}
		
	}, {
		
		name:'Quarry Crusher',
		
		// the output folder for compiled files
		_folder:null,

		init: function() {
			this._folder = system.resolvePath('crusher:/');
		},
		
		/*
		 * convert the module name into a full path for the cache
		 */
		moduleCachePath: function(module) {
			return this._folder + module + '.js';
		},
		
		client: function(module, registryClient, loadedCallback) {
			
			var crusher = this;
			
			// first lets see if the crusher client can load the crushed file from disk
			crusher.loadFile(module, true, function(error, contents, filePath) {
				
				// we have found some contents so we don't need an RPC request
				if(!error && contents) {
					loadedCallback(null, contents, filePath);
					return;
				}
				
				
				registryClient.runQuery('crusher/crush', {
	  				
	  				module:module
	  				
	  			}, function(error, response) {
	  				
	  				if(response && response.error) {
	  					loadedCallback(response.error);
	  					return;
	  				}
	  					
	  				// now we know the file has been built - we can try again to return the file source
	  				crusher.loadFile(module, false, loadedCallback);
	  					
	  			});
	  			
	  		});
		},
		
		/*
		 * check to see if the cache file exists for the module name
		 * ignore is used until we sort out the caching properly
		 */
		loadFile: function(module, ignore, loadedCallback) {
			var crusher = this;
			
			// this is until we sort out the caching
			if(ignore) {
				loadedCallback(true);
				return;
			}
			
			var filePath = crusher.moduleCachePath(module);
			
			system.readFile(filePath, function(error, contents) {
				loadedCallback(error, contents, filePath);	
			});
		},
		
		remove: function(module, callback) {
			var crusher = this;
			system.removeFile(crusher.moduleCachePath(module), callback);
		},
		
		crush: function(module, callback) {
			
			var crusher = this;
			
			// output the source using external process
			system.runProgram('runcrusher', [module], function(error, stdout) {
			
				if(error) {
					callback(error);
					return;
				}
				
				var path = crusher.moduleCachePath(module);
				
				system.chmod(path, function() {
					callback(error, {
						path:path,
						stdout:stdout	
					});
				});
				
			});
			
		}
		
	});
	
});