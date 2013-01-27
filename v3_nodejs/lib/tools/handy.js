/*!
 * jQuarry: Handy Tools
 *
 *
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
    async = require('async');

var tools = {};

/**
 * generate a new global id
 */

tools.quarryid = function(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
	});
}

/**
 * takes a string and prepares it to be used in a RegExp itself
 */

tools.escapeRegexp = function(search){
  return search.replace(/([\!\$\(\)\*\+\.\/\:\=\?\[\\\]\^\{\|\}])/g, "\\$1");
}

/**
 * Pretty prints an object to the console
 */

tools.dir = function(search){
  console.log(JSON.stringify(search, null, 4));
}

tools.log = function(search){
  console.log(JSON.stringify(search));
}

tools.middleware = function(target){

	var middleware = {};

	target.use = function(route, middlewareFunction){
		var arr = middleware[route] ? middleware[route] : middleware[route] = [];

		arr.push(middlewareFunction);

		return this;
	}

	target.pipe = function(route, args, callback){
		args = args ? args : [];

		async.forEachSeries(middleware[route], function(middlewareFunction, next){
			middlewareFunction.apply(target, args.concat(next));
		}, function(error){
			console.log('FINISHED RUNNING MIDDLEWARE');
			callback(error, res);
		})
	}
}

exports = module.exports = tools;
