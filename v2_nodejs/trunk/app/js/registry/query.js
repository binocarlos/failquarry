/*
 * @class 		registry.query
 * @singleton
 * @filename   	registry/query.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * abstraction for a registry query either modify or read
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'async',
	
	'system'
	
], function(

	_,
	
	async,
	
	systemClass
	
) {
	
	var system = systemClass.instance();
	
	var queryShortcuts = {
		
	};
	
	var runQuery = function(broker, queryName, options, finishedCallback) {
		
		queryName = queryShortcuts[queryName] ? queryShortcuts[queryName] : queryName;
		
		require(['registry/query/' + queryName], function(queryFunction) {
			
			queryFunction(broker, options, finishedCallback);
				
		});
	};
	
	return runQuery;
});