/*
 * @filename   	ronfig/index.js
 * @package    	ronfig
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * ronfig - you give it an array of JSON file names - it turns it into a cascading 
 * robject
 *
 *
 *
 */
 
define([

	'jahmerge',
	
	'robject',
	
	'fs',
	
	'underscore',
	
	'async',
	
	'system/server/utils'
	
], function(

	jahmerge,
	
	robject,
	
	fs,
	
	_,
	
	async,
	
	utils
	
	) {

	
	// called to rebuild the cascade
	// if the filePath is given it means this was triggered from the file system changing
	// otherwise its just internal messing around
	function rebuild()
	{
		var currentRobject = this;
		
		// if we are in the process of rebuilding then return (avoids the double inotify events)
		if(currentRobject.rebuilding) {
			
			return;
			
		}
		
		currentRobject.rebuilding = true;
		
		var doTheRebuild = function(err) {
			
			currentRobject.applySources(currentRobject._sources, function(err) {
				
				if(becauseOfFilePath) {
					utils.message('flash', 'Hot Swap Config', this.get('name'));
				}
				
				currentRobject.rebuilding = false;
			});
		}
		
		doTheRebuild();
	}

	// called in the context of the robject you want to add configs to
 	function addThings(things, where, finishedCallback) {
 		
 		// this means where are default to adding things on the end
 		if(finishedCallback==null) {
 		
 			finishedCallback = where;
 			where = 'end';
 			
 		}
 		
 		if(things==null) {
		
			things = [];
			
		}
		
		if(!_.isArray(things)) {
			
			things = [things];
			
		}
		
		var newSources = [];
		var oldSources = this._sources;
		
		if(things==null) {
			newSources = oldSources;
		}
		else if(oldSources==null) {
			newSources = things;	
		}
		else if(where=='end') {
			newSources = oldSources.concat(things);
			
		}
		else if(where=='start') {
			newSources = things.concat(oldSources);
		}
		
 		this.applySources(newSources, finishedCallback);
 	};
 			
	// loop through the sources for the ronfig in order and build up the robject from them
 	function applySources(sources, finishedCallback) {
 		
 		var newRobject = makeABlankRobject();
 		var currentRobject = this;
 		
 		currentRobject._sources = sources;
 		
 		// read in each config file and merge it with the current data set
		async.forEachSeries(sources, function(source, callback) {
			
			// we assume this to be a provider function - it will be run each time the data is needed
			if(_.isFunction(source)) {
				
				// run the provider function
				source(function(error, rawData) {
					
					newRobject.addData(rawData);
				
					callback(null);
					
				});
				
			}
			// we assume this is raw data to add
			else if(_.isObject(source)) {
				newRobject.addData(source);
				
				async.nextTick(function() {
				
					callback(null);
					
				});
			}
			// we assume this is a file path to add (NOTE MUST BE JSON FILE)
			else if(_.isString(source)) {
				fs.readFile(source, 'utf8', function(err, fileContents) {
					
					if(err) {
						console.log('Error reading config file: ' + source);	
						return;
					}
					
					// turn the config into JSON
					var parsedJSON;
					
					try {
				 		parsedJSON = JSON.parse(fileContents);
					} catch (e) {
						
						console.log('Error parsing config JSON: ' + source);
						return;
						
					}
					
					async.nextTick(function() {
						
						newRobject.addData(parsedJSON);
						
						callback();
						
					});
						
				});
			}
				
		}, function(err) {
	
			currentRobject.replace(newRobject);
			
			if(finishedCallback) {
				finishedCallback(err, currentRobject);
			}
			
		});
		
	};
	
	// create a blank robject that will be wrapped into a ronfig
	var makeABlankRobject = function() {
		
		// make the robject that will be cast into a ronfig (by adding some extra functions)
		var returnObject = robject.factory();
		
		// keep track of the things added to the ronfig so we can rebuild if any of it changes
		returnObject._sources = [];
		
		// setup the addFiles extension to the robject
		returnObject.addThings = addThings;
		
		// setup the rebuild extension to the robject
		returnObject.rebuild = rebuild;
		
		// setup the clone extension to the robject
		returnObject.flatten = function() {
		
			return robject.factory(jahmerge(true, {}, this.data));
			
		};
		
		// setup the applySources extension to the robject
		returnObject.applySources = applySources;
		
		return returnObject;
	};
		
	var makeARonfig = function(data, readyCallback) {
		
		var returnObject = makeABlankRobject();
	
		returnObject.addThings(data, function() {
		
			if(readyCallback) {
			
				readyCallback(null, returnObject);
				
			}
			
		});

		return returnObject;
	};
	
	return {
		
		factory:makeARonfig
		
	}
	
	
});