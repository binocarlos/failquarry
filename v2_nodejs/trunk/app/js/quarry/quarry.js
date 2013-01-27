/*
 * @class jquarry
 * @extends base
 * @filename   	jquarry.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * Main jQuarry file
 *
 * 
 * 
 *
 */

define([

	'base',
	
	'underscore',
	
	'async',
	
	'./container'
	
	
], function(

	base,
	
	_,
	
	async,
	
	containerClass
	
) {
	
	// we save the rpcFunction (i.e. how to connect to servers)
	// this is used in the client context not the server
	var rpcFunction = null;
	
	/*
	 * Main jQuarry entry function - $quarry(...)
	 */
	var jQuarry = function(selector, context) {
		
		if(!rpcFunction) {
			throw new Error('The RPC function has not been assigned');
		}
		
		// first - make a new container that will promise to fill itself with elements
		var container = containerClass.factory();
		
		// fetch the data using the RPC function
		rpcFunction({
			selector:selector,
			context:context
		}, function(error, results) {
			container.fill(results);
		});
		
		return container;
		
		/*
		// the contract based on the clients query
		var contract = contractClass.factory();
		
		contract.process(query, function(error, results) {
			console.log('done');
		});
		
		// first - make a new container that will promise to fill itself with elements
		var container = containerClass.factory(contract);
		
		// send the container to the warehouse to be filled
		warehouse.fillContainer(container);
		
		// return it immediately so the client can work with it
		return container;
		*/
	};
	
	/*
	 * setup the quarry to run in the given environment
	 */
	jQuarry.configure = function(config) {
		rpcFunction = config.rpcFunction;
	};
	
	/*
	 * expose the quarry
	 */
	return jQuarry;
	
});