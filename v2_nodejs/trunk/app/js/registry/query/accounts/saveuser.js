/*
 * @class 		registry.query.accounts.saveuser
 * @singleton
 * @filename   	registry/query/accounts/saveuser.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * creates a new user
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
	
	base,
	
	async
	
) {

	var updateUser = function(broker, options, finishedCallback) {
		finishedCallback();
	};
	
	/*
	 * make a new user and return
	 *
	 * the config for this query:
	 *
	 * 	* name - the full name for the user
	 *	* quarry & quarrypassword - if these are set then it's a proper quarry user
	 *	* facebook - facebook id
	 *	* twitter - twitter id
	 */
	var createUser = function(broker, options, finishedCallback) {
			
		var registry = broker.get('accounts');
			
		var userClass = registry.ormclass('user');
			
		var userData = {
			name:options.name,
			quarrypassword:options.quarrypassword,
			quarry:options.quarry,
			facebook:options.facebook,
			twitter:options.twitter,
			installation_id:options.installation_id
		};
			
		userClass.create(userData).success(function(user) {
					
			// the user is now in the db
			registry.addUser(user, function(error) {
						
				finishedCallback(error, user);		
			});
				
		});
			
	};
	
	var run = function(broker, options, finishedCallback) {
			
		if(options.user_id) {
			updateUser(broker, options, finishedCallback);
		} else {
			createUser(broker, options, finishedCallback);
		}
	};
	
	return run;

});