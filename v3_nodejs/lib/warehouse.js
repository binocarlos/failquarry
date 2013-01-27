/*!
 * JQuarry Job - abstraction of running through a selector
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
		containerFactory = require('./container'),
		supplierFactory = require('./supplier/factory'),
		queryFactory = require('./query'),
    async = require('async');


// methods
var factory = function(rootSupplierType, rootContainer, readyCallback){

	var warehouse = supplierFactory(rootSupplierType, rootContainer).on('ready', function(){
		
		// keep the original find - we will chuck a query at it
		var originalFindMethod = warehouse.find;

		warehouse.find = function(selector, context, findCallback){

			if(arguments.length==2){
				findCallback = context;
				context = null;
			}
			var warehouseQuery = queryFactory(selector, context);

			// check in the context results to see if we have _meta.supplier
			warehouseQuery.triggerContextSearch = function(selector, contextResults, contextSearchCallback){

				
				var contextSearchResults = [];

				async.forEach(contextResults, function(contextResult, nextContextResult){
					var supplierType = contextResult.meta('supplier');


					if(supplierType){
						
						supplierFactory(supplierType, contextResult).on('ready', function(childSupplier){
							
							childSupplier.find(selector, function(error, childSupplierResults){
								contextSearchResults = contextSearchResults.concat(childSupplierResults.children());
								nextContextResult(error);
							})
						})

					}
					else{
						nextContextResult();
					}
				}, function(error){
					contextSearchCallback(error, contextSearchResults);
				})
			}

			originalFindMethod.apply(warehouse, [warehouseQuery, findCallback])

		}
	})

	
	
	return warehouse;
}

// expose createModule() as the module
exports = module.exports = factory;