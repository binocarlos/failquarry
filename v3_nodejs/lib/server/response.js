/*!
 * JQuarry server response
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var	async = require('async'),
		EventEmitter = require('eventemitter2').EventEmitter2,
		_ = require('underscore');

// in: express application
// out: jquarry express middleware mapper
function responseFactory(req){

	var res = _.extend({}, {
		id:req.id,
		req:req
	});

	return res;
}

// expose createModule() as the module
exports = module.exports = responseFactory;