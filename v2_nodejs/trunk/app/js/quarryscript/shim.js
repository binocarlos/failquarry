/*
 * @class 		quarryscript.requireshim
 * @filename   	quarryscript/requireshim.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * 
 * very lightweight define & require functions
 *
 * this is expecting to be wrapped up in a closure externally
 * it will appear just before the crushed version of the sandbox require tree
 *
 *
 */

var require, define;

var context = this;

if(!context.console) {
	
	context.console = {
		output:'',
		log:function(st) {
			this.output += st + "\n";		
		}
	};
}

if (typeof context.process === 'undefined') {
	
	context.process = {
		nextTick: function (fn) {
			fn();
		}
	};
	
};

// lets do a shim for the thread in case we are in the doctor
// THIS MEANS WE ARE IN THE DOCTOR
if(!context.thread) {
	context.isDoctor = true;
	
	var eventMap = {
		log:function(st) {
			if(console && console.log) {
				//console.log(st);
			}
		},
		request: function(request) {
			
		},
		booted: function(documentId) {
			
			// tell the doctor we have booted
			
		},
		documentParsed: function(documentId, error, page) {
						
					
		}
	};
	
	context.thread = {
		emit: function() {
			var args = [].slice.call(arguments);
			var eventName = args.shift();
			var eventFunction = eventMap[eventName];
			
			if(eventFunction) {
				eventFunction.apply(context, args);	
			}
			
		},
		on: function(eventName, callback) {
			eventMap[eventName] = callback;
		}
	}
}

(function() {

var deps = {};

// this will run the callback with whatever is in deps for the modulename
require = function(moduleNames, callback) {
	if(!moduleNames instanceof Array) {
		moduleNames = [moduleNames];
	}
	var modules = [];
	for(var i in moduleNames) {
		var moduleName = moduleNames[i];
		modules.push(deps[moduleName]);
	}

	callback.apply(context, modules);
};

// so we need to resolve the deps and pass them as arguments to the definition function
// the return value of the definition function is what we store as the dep value
define = function(moduleName, depNames, definition) {
	
	if(definition==null) {
		definition = depNames;
		depNames = [];
	}
	
	var depModules = [];
	
	for(var i in depNames) {
		var depName = depNames[i];
		if(depName.indexOf('./')==0) {
			baseName = moduleName;
			var moduleNameArr = moduleName.split('/');
			if(moduleNameArr.length>1) {
				var last = moduleNameArr.pop();
				baseName = moduleNameArr.join('/');
			}
			
			depName = depName.replace(/^\./, baseName);
		}
		else if(depName.indexOf('../')==0) {
			baseName = moduleName;
			var moduleNameArr = moduleName.split('/');
			if(moduleNameArr.length>2) {
				var last = moduleNameArr.pop();
				var last2 = moduleNameArr.pop();
				baseName = moduleNameArr.join('/');
			}
			
			depName = depName.replace(/^\./, baseName);
		}
		if(!deps[depName]) {
			throw new Error('There is no module for: ' + depName);
		}
		depModules.push(deps[depName]); 
	}
	
	deps[moduleName] = definition.apply(context, depModules);
	
};


})();