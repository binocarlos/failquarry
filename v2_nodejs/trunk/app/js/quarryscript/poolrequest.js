/*
 * @class 		quarryscript.poolrequest
 * @filename   	quarryscript/query.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * poolrequest is a request for some data from within a quarry script thread
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'async',
	
	'robject'
	
	
], function(

	_,
	
	base,
	
	async,
	
	robject
	
) {
	
	var requestShortcuts = {
		
	};
	
	/*
	 * the factory function
	 */
	var factory = function(name, options, queryCallback) {
		
		var queryName = requestShortcuts[name] ? requestShortcuts[name] : name;
			
		require(['quarryscript/poolrequest/' + queryName], function(queryFunction) {
			
			queryFunction(options, queryCallback);
				
		});
	};
	
	return factory;

});