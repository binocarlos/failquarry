/*
 * @class 		registry.query.reception.home
 * @singleton
 * @filename   	registry/query/reception/home.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * list the websites and databases for an installation
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'async'
	
], function(

	_,
	
	async
	
) {
	
	/*
	 * ask the request what it wants and then use the website registry to find the decision
	 */
	var run = function(broker, options, finishedCallback) {
			
		var registry = broker.get('accounts');
			
		async.series({
				
			websites:function(doneCallback) {
				// ask the registry if it has a user for a quarry id
				registry.listWebsites({
					user_id:options.user_id
				}, function(error, websites) {
					doneCallback(null, websites);
				});
			},
				
			databases:function(doneCallback) {
				// ask the registry if it has a user for a quarry id
				registry.listDatabases({
					user_id:options.user_id
				}, function(error, databases) {
					doneCallback(null, databases);
				});
			}
				
		}, function(error, props) {
				
			finishedCallback(null, props);
		});			
	};
		
	return run;

});