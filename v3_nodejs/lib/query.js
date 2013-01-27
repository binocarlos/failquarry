/*!
 * JQuarry Job - abstraction of running through a selector
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
		contractFactory = require('./legal/contract'),
		containerFactory = require('./container'),
		handy = require('./tools/handy'),
		EventEmitter = require('eventemitter2').EventEmitter2,
    async = require('async');


// methods
var factory = function(mainSelector, mainContext, startingResults){

	mainSelector = contractFactory(mainSelector);
	mainContext = contractFactory(mainContext, true);

	function query(){}

	_.extend(query, EventEmitter.prototype);

	query._isQuery = true;

	// a chance to leap in on what context results were loaded from this supplier
	// this lets you add to what is being loaded mid-query
	// this happens in the warehouse where the context loads some suppliers
	// the warehouse will use this method to turn a plain container that is tag=supplier
	// into an actual supplier and run the selector against it
	// the original container (that had the context run against it) will also
	// load context results - everything will be merged at the end
	query.triggerContextSearch = function(selector, contextResults, next){

		next && next();
		
	}

	query.clone = function(newStartingContext){
		var ret = factory(mainSelector, mainContext, newStartingContext);

		ret.triggerContextSearch = query.triggerContextSearch;

		return ret;
	}

	query.selector = function(){
		return mainSelector;
	}

	query.context = function(){
		return mainContext;
	}

	query.run = function(selectFunction, finishedCallback){

		// returns an array of containers (they can be partially filled)
		var chainSelectors = function(selectors, previousResults, chainedCallback){

			var copySelectors = function(){
	 			return _.map(selectors, function(val){return val;});
	 		}

	 		selectors = copySelectors();

	 		var selector = selectors.shift();

	 		selectFunction(selector, previousResults, function(error, results){

	 			results = results ? results : [];
	 			
	 			// as soon as we get zero results there is no point continuing
	 			if(results.length<=0){
	 				chainedCallback(null, []);
	 				return;
	 			}
	 			// we still have some chaining to do
		 		if(selectors.length>0){

		 			// we keep chaining until we have run out of selectors
					chainSelectors(selectors, results, chainedCallback);
				}
				// here we have the final results
				else{
					chainedCallback(error, results);
				}
			}) 		
		}

		// returns an array of containers
		var runContract = function(contract, previousResults, callback){

			// the top level results from each phase
			var allResults = [];

			async.forEach(contract.phases(), function(phase, nextPhase){

				var selectors = phase.selectors();

				// chain the selectors and get an array of containers back
				chainSelectors(selectors, previousResults, function(error, phaseResults){

					if(!error){
						allResults = allResults.concat(phaseResults);
					}
					
					nextPhase(error);
				});

			}, function(error){

				callback(error, allResults);
			})
		}

		// this means run the selector through each of the results from the context
		if(!mainContext.isEmpty()){

			runContract(mainContext, startingResults, function(error, contextResults){

				// now there are 2 things to do
				async.parallel({

					// a) run the context results through the filter method
					filter:function(next){
						query.triggerContextSearch(mainSelector, contextResults, next);
					},

					// b) carry on with the original container and run the context results against it
					container:function(next){
						runContract(mainSelector, contextResults, next);
					}
				}, function(error, results){

					var finalResults = (results.filter || []).concat(results.container || []);

					finishedCallback(error, finalResults);
				})
			})
		}
		// we are running the actual selector
		else {
			
			runContract(mainSelector, startingResults, finishedCallback);
		}
	}
	
	return query;

}

// expose createModule() as the module
exports = module.exports = factory;
