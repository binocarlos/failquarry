/*
 * @class 		registry.query.security.checkquarryuser
 * @singleton
 * @filename   	registry/query/security/checkquarryuser.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * check to see if there is a quarry user already with the given username
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
		var query = this;
			
		// ask the registry if it has a user for a quarry id
		registry.findUser({
			api:'quarry',
			id:options.login
		}, function(error, ormUser) {			
			var ret = {};

			if(!ormUser) {
				ret.status = false;
				ret.error = 'There is no user with that login';
			}
			else if (ormUser.quarrypassword!=options.password) {
				ret.status = false;
				ret.error = 'Incorrect password';
			}
			else {
				ret.status = true;
				ret.user = ormUser.getSecurityUser().rawData();
			}
				
			finishedCallback(null, ret);
		});
			
	};
	
	return run;

});