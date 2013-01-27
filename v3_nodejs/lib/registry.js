
/*!
 * Registry
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
		handy = require('./tools/handy'),
		RegExpquote = require('regexp-quote'),
		contractFactory = require('./legal/contract'),
		queryFactory = require('./query'),
    async = require('async');

var ensureMapEntry = function(map, prop){
	return map[prop] ? map[prop] : map[prop] = {};
}

var addContainerToMap = function(container, map){
	var id = container.id();
	var tag = container.tag();
	var classNames = container.classNames();

	map.all[container.quarryid()] = container;

	if(!_.isEmpty(id)){
		var entry = ensureMapEntry(map.id, id);
		entry[container.quarryid()] = container;
	}

	if(!_.isEmpty(tag)){
		var entry = ensureMapEntry(map.tag, tag);
		entry[container.quarryid()] = container;
	}

	_.each(_.keys(classNames), function(className){

		var entry = ensureMapEntry(map.className, className);
		entry[container.quarryid()] = container;
	});

}

var removeContainerFromMap = function(container, map){
	var id = container.id();
	var tag = container.tag();
	var classNames = container.classNames();

	delete(map.all[container.quarryid()]);

	if(!_.isEmpty(id)){
		var entry = ensureMapEntry(map.id, id);
		delete(entry[container.quarryid()]);
	}

	if(!_.isEmpty(tag)){
		var entry = ensureMapEntry(map.tag, tag);
		delete(entry[container.quarryid()]);
	}

	_.each(_.keys(classNames), function(className){
		var entry = ensureMapEntry(map.className, className);
		delete(entry[container.quarryid()]);
	});
}

var getIntersectionOfObjects = function(array) {
	if(_.isEmpty(array)){
		return [];
	}
  var slice = Array.prototype.slice; // added this line as a utility
  var rest = slice.call(arguments, 1);
  return _.filter(_.uniq(array), function(item) {
    return _.every(rest, function(other) {
      //return _.indexOf(other, item) >= 0;
      return _.any(other, function(element) { return _.isEqual(element, item); });
    });
  });
};

var compareFunctions = {
  "=":function(check, target){
    return check==target;
  },
  "!=":function(check, target){
    return check!=target;
  },
  ">":function(check, target){
    target = parseFloat(target);
    return !isNaN(target) ? check > target : false;
  },
  ">=":function(check, target){
    target = parseFloat(target);
    return !isNaN(target) ? check >= target : false;
  },
  "<":function(check, target){
    target = parseFloat(target);
    return !isNaN(target) ? check < target : false;
  },
  "<=":function(check, target){
    target = parseFloat(target);
    return !isNaN(target) ? check <= target : false;
  },
  "^=":function(check, target){
    return check.match(new RegExp('^' + RegExpquote(target), 'i'));
  },
  "$=":function(check, target){
    return check.match(new RegExp(RegExpquote(target) + '$', 'i'));
  },
  "~=":function(check, target){
    return check.match(new RegExp('\W' + RegExpquote(target) + '\W', 'i'));
  },
  "|=":function(check, target){
    return check.match(new RegExp('^' + RegExpquote(target) + '-', 'i'));
  },
  "*=":function(check, target){
    return check.match(new RegExp(RegExpquote(target), 'i'));
  },
}

var searchRegistry = function(map, selector){
	var intersectionArrays = [];
	var hasSearch = false;

	if(selector.isWildcard()){
		results = _.values(map.all);
		intersectionArrays.push(results);
	}
	else{
		if(selector.id()){
			hasSearch = true;
			var results = _.values(map.id[selector.id()]);
			if(!_.isEmpty(results)){
				intersectionArrays.push(results);
			}
		}

		if(selector.tag()){
			hasSearch = true;
			var results = _.values(map.tag[selector.tag()]);
			if(!_.isEmpty(results)){
				intersectionArrays.push(results);
			}
		}

		_.each(_.keys(selector.class()), function(className){
			hasSearch = true;
			var results = _.values(map.className[className]);
			if(!_.isEmpty(results)){
				intersectionArrays.push(results);
			}
		})
	}

	// we now make a list of either the ones that matched ALL of the above
	// OR just all children
	var searchThroughArray = hasSearch ? getIntersectionOfObjects.apply(null, intersectionArrays) : _.values(map.all);

	_.each(selector.attr(), function(attrFilter){

		searchThroughArray = _.filter(searchThroughArray, function(searchThroughContainer){			
			var value = searchThroughContainer.attr(attrFilter.field);
			// [size]
			if(!attrFilter.operator && !_.isUndefined(value)){
				return true;
			}

			// [size>100]
			if(compareFunctions[attrFilter.operator]){
				return compareFunctions[attrFilter.operator](value, attrFilter.value);
			}
			else{
				return false;
			}
		});
	});

	return searchThroughArray;
}

/**
 * The registry looks after a map of id, classname and tag children and descendents for an element
 */

// methods
var factory = function(){

	var registry = function() {}

	// get a map for the children
	var map = {
		all:{},
		tag:{},
		id:{},
		className:{}
	};

	// the actual child array
	var children = [];

	// a map of containers by their id onto functions registered to 
	// listen for meta changes
	var listenerFunctions = {};

	// do we ignore any additions/removals
	var isSilent = false;

	registry.silent = function(newValue){
		return isSilent = _.isBoolean(newValue) ? newValue : isSilent;
	}
	registry.children = function(){
		return children;
	}

	registry.count = function(){
		return children.length;
	}
	// get a list of this containers descendents
	registry.descendents = function(){
		var ret = [];
		_.each(this.children(), function(child){
			ret.push(child);
			ret = ret.concat(child.descendents());
		});
		return ret;
	}

	registry.addContainer = function(child){
		if(this.silent()){
			return;
		}
		children.push(child);
		addContainerToMap(child, map);

		listenerFunctions[child.quarryid()] = function(name, value){
			if(name.match(/^(class|tag|id)/)){
				removeContainerFromMap(child, map);
				addContainerToMap(child, map);
			}
		};

		child.on('meta', listenerFunctions[child.quarryid()]);
		
	}

	registry.removeContainer = function(child){
		if(this.silent()){
			return;
		}
		children = _.without(children, child);
		
		removeContainerFromMap(child, map);

		child.removeListener('meta', listenerFunctions[child.quarryid()]);

		delete(listenerFunctions[child.quarryid()]);

	}

	registry.map = function(){
		return map;
	}

	// this accepts a full selector - used the indexes to
	// grab the initial results (from id, tag and class)
	// then filters them for attributes
	registry.search = function(selector){
		if(this.silent()){
			return [];
		}
		
		return searchRegistry(map, selector);
	}

	// run the overall selector with context via this container
	registry.find = function(query, findCallback){

		if(!_.isFunction(findCallback)){
			findCallback = context;
			context = null;
		}

		if(this.silent()){
			findCallback()
			return;
		}

		var self = this;

		query.run(function(selector, previousResults, runCallback){

			// if we are using previous results then actuall we want to use them to search the selector

			if(!previousResults || previousResults.length<=0){
				previousResults = [self];
			}
			else{
				previousResults = _.map(previousResults, function(previousResult){
					return previousResult.registry();
				})
			}

			var allSearchResults = [];

			// we have an array of registries now
			async.forEach(previousResults, function(searchRegistry, nextResult){
				// this adds in the descendents also
		 		if(selector.isDescendent()){

		 			var searchRegistries = [];

		 			var addSearchRegistry = function(addSearchReg){
		 				
		 				searchRegistries.push(addSearchReg);
		 				
		 				_.each(addSearchReg.children(), function(child){
		 					addSearchRegistry(child.registry());
			 			})	
		 			}

		 			addSearchRegistry(searchRegistry);

		 			_.each(searchRegistries, function(searchRegistry){
		 				allSearchResults = allSearchResults.concat(searchRegistry.search(selector));
		 			})

		 			nextResult();
		 		}
		 		else{

		 			allSearchResults = allSearchResults.concat(searchRegistry.search(selector));
		 			nextResult();
		 		}
			}, function(error){
				runCallback(error, allSearchResults);
			});

		}, findCallback);

		return this;
	}

	return registry;
}

exports = module.exports = factory;
