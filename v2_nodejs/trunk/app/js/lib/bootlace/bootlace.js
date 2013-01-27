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

	'base',
	
	'async',
	
	'underscore',
	
	'ronfig',
	
	'config'
	
], function(

	base,
	
	async,
	
	_,
	
	ronfig,
	
	configLoader
	
) {
	
	return base.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		/*
		 * @static
		 * generic factory to make a new instance of the given class
	  	 */
		factory: function(config) {
			
			return new this.prototype.constructor(config);
			
		}
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		
		name: 'Bootlace Object',
		
		// the ultra default config for the system
		_config:{},
		
		// keep track of the object depth for dev logging
		_indent:0,
		
		/**
		 * @constructor
		 */
		init: function(options) {
			
			this._config = options || {};
			
			this.message('setup', this.name + ' SETUP');
			
			this.setupObjects();
			
		},
		
		/**
		 * shortcut to the ronfig
		 */
		config: function(path) {
			
			return this._config.get(path);
			
		},
		
		/**
		 * gets everything setup and calls a ready function when its done
		 */
		setupObjects: function() {
			
			var bootlace = this;
			
			// trigger all the setup to run at the same time
			async.forEachSeries(bootlace.getObjectSetupFunctions(), function(objectConstructor, nextCallback) {
			
				if(!_.isFunction(objectConstructor)) {
					console.log(bootlace);
					nextCallback();
					return
				}
				
				bootlace.messageIndent(1);
				
				
				// run the object constructor function
				objectConstructor(function() {
					
					bootlace.messageIndent(-1);
					nextCallback();
							
				});
				
				
			}, function(err) {
				
				// hook into pre-setup finalizing
				bootlace.postSetup(function() {
				
					bootlace.message('complete', bootlace.name + ' COMPLETE');
				
					// we are setup and ready to go
					bootlace.trigger('ready');
					
				});
				
			});
			
			
			
		},
		
		/**
		 * called once setup objects has finished - the last stop before the ready event is fired
		 */
		postSetup: function(callback) {
			
			callback();
			
		},
		
		/**
		 * get the functions to perform the setup
		 *
		 */
		getObjectSetupFunctions: function() {
			
			var bootlace = this;
			var ret = [];
			
			// load the config object for this bootlace
			ret.push(function(callback) {
					
				bootlace.loadConfig(callback);
				
			});
			
			return ret;
			
		},

		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			return [
				
				this._config
				
			];
			
		},
		
		/**
		 * loads the cascading config for this system
		 *
		 */
		loadConfig: function(mainCallback) {
			
			var bootlace = this;
			
			bootlace.message('header', 'Loading config');
			
			var files = bootlace.getConfigFiles();
			var newFiles = [];
			
			async.forEachSeries(files, function(file, callback) {
			
				var actualFile = _.isString(file) ? configLoader.filePath(file) : file;
				
				bootlace.message('event', 'config', actualFile);
				newFiles.push(actualFile);
				callback();
				
			}, function() {
				
				ronfig.factory(newFiles, function(err, conf) {
					
					bootlace._config = conf;
						
					mainCallback(err);
					
				});
			
			});
		},
		
		
		messageIndent: function(direction) {
			
			require(['system/server/utils'], function(utils) {
				utils.messageIndent(direction);
			});
			
		},
		/**
		 * proxy to the system
		 */
		message: function(type, title, text) {
			
			var bootlace = this;
			
			require(['system/server/utils'], function(utils) {
				utils.message(type, title, text);
			});
			
		}
		
	});
	
});