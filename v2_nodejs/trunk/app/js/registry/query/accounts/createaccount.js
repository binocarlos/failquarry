/*
 * @class 		registry.query.createaccount
 * @singleton
 * @filename   	registry/query/createaccount.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * make a new account query
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'../../query',
	
	'async'
	
], function(

	_,
	
	queryFactory,
	
	async
	
) {
	
		
	/*
	 * a create account query takes a few arguments
	 * at all points - a new installation will be created
	 * the config will have:
	 *
	 *	* name = the name for the installation
	 *	* website = the domain of a website to create
	 *		* subdomain
	 *	* user = user object for the installation
	 *		* name = the fullname for the user
	 *		* quarry = the quarry username for the user (if using that auth)
	 *		* quarrypassword = the quarry quarrypassword for the user (if using that auth)
	 *		* facebook = the facebook id
	 *		* twitter = the twitter id
	 */
	return function(broker, options, finishedCallback) {
			
		var registry = broker.get('accounts');
		var mainOptions = options;
		
		queryFactory(broker, 'accounts/createinstallation', {		
			name:mainOptions.installation_name,
			config:{}
		}, function(error, installation) {
				
			// here we have a spanking new installation & it's been added to the registry
			
			var series = [];
			var returnData = {
				installation_id:installation.id
			};
				
			// check to see if we want to create a website
			if(mainOptions.website) {
				series.push(function(nextSeries) {
					
					queryFactory(broker, 'accounts/savewebsite', {	
						name:'default',
						domains:mainOptions.website.subdomain + '.quarry',
						config:{},
						installation_id:installation.id
					}, function(error, website) {
							
						// this is the website we have created
						returnData.website_id = website.id;
						nextSeries();
					});
						
				});
			}
				
			// check to see if we want to create a user
			if(mainOptions.user) {
				series.push(function(nextSeries) {
						
					var userConfig = mainOptions.user;
					userConfig.installation_id = installation.id;
					
					queryFactory(broker, 'accounts/saveuser', userConfig, function(error, user) {
							
						// this is the user we have created
						returnData.user_id = user.id;
						nextSeries();
					});
						
				});
			}

			// make the default database
			series.push(function(nextSeries) {

				queryFactory(broker, 'accounts/savedatabase', {
					name:'default',
					drive:'default:/',
					config:'{}',
					installation_id:installation.id
				}, function(error, database) {
							
					returnData.database_id = database.id;	
					// the database is created
					nextSeries();
										
				});
						
			});
				
			async.series(series, function() {
					
				// we have run the query
				finishedCallback(null, returnData);
			});
			
		});
			
	}

});