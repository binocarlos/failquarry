/*
 * @class 		system.server.dbqueries.websites
 * @filename   	system/server/dbqueries/websites.js
 * @package    	system.server.dbqueries
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * dbquery to load all of the quarry websites
 *
 *
 */

define([

	'async'
	
], function(

	async
	
) {
	
	var buildInstallationQuery = function(config) {
		
		var args = [];
		
		var parts = [
		
'SELECT',
'	website.*,',
'	installation.id as installation_id,',
'	installation.root as installation_root',
'FROM',
'	installation',
'WHERE',
'	id = ?'

		];
		
		return {
			query:parts.join("\n"),
			args:args
		};
		
	}
	
	var buildWebsiteQuery = function(config) {
		
		var args = [];
		
		var parts = [
		
'SELECT',
'	website.*,',
'	installation.id as installation_id,',
'	installation.root as installation_root',
'FROM',
'	installation',
'WHERE',
'	id = ?'

		];
		
		return {
			query:parts.join("\n"),
			args:args
		};
		
	}
	
	// turn the list of installations into a list of websites
	// process the JSON string and iterate
	var processResults = function(rows, cols, finishedCallback) {
		
		var finalWebsites = [];
		
		async.forEach(rows, function(installation, installationCallback) {
			
			// convert the websites from the JSON
			installation.websites = JSON.parse(installation.config);

			async.forEach(installation.websites, function(website, websiteCallback) {
				
				website.installation_id = installation.id;
				website.installation_root = installation.root;
				
				finalWebsites.push(website);
				
				websiteCallback();
				
			}, function() {
			
				installationCallback();
					
			});
			
		}, function() {
			
			finishedCallback(null, finalWebsites);
			
		});
		
	};
	
	return {
	
		query:buildQuery,
		process:process
		
	}
	
});