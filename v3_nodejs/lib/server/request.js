/*!
 * JQuarry server request
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var	async = require('async'),
		_ = require('underscore');

// in: express application
// out: jquarry express middleware mapper
function requestFactory(config){

	var req = _.extend({}, config);
	
	return req;
}

// expose createModule() as the module
exports = module.exports = requestFactory;