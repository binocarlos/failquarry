/*
 * @class 		system.server.dbquery
 * @singleton
 * @filename   	system/server/dbquery.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * base class for database queries
 *
 *
 */

define([

	'async',
	
	'underscore',
	
	'system'
	
], function(

	async,
	
	_,
	
	systemClass
	
) {
	
	var system = systemClass.instance();
	
	var stripFunctionComments = function(sStr) {
		
		var s = '' + sStr;
		
		var matches = s.match(/function[\s\S]+?\/\*([\s\S]+?)\*\//i);
		
		if(matches) {
			return matches[1];
		}
		else {
			return null;
		}

	};
	
	return {
		/**
		 * @static
		 * @param {Object} config
		 * 	this will have a params array with data to fill in
		 * Run the named query with the given config and give the results/error to the callback
		 */
		factory: function(queryName, config, mainCallback) {
			
			config = config || {};
			
			require(['system/server/dbqueries/' + queryName], function(dbquery) {
				
				// run the query function and return whatever back to the mainCallback
				dbquery(database, config, mainCallback);
				
				var database = system.database();
				
				database.query(queryString, argsFunction(config), function(error, rows, cols) {
					
					if(error) {
						console.log('Query Error: ' + error);
						return;
							
					}
					
					processFunction(rows, cols, mainCallback);
					
				});
			
			});
			
		}
		
	};
	
});