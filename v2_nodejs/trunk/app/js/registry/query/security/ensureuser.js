/*
 * @class 		registry.query.security.ensureuser
 * @singleton
 * @filename   	registry/query/security/ensureuser.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * ensure that the user exists in the system
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'../../query',
	
	'async',
	
	'security/user'
	
], function(

	_,
	
	queryFactory,
	
	async,
	
	userClass
	
) {
	
		
	var linkOrmApis = function(options, finishedCallback) {
		
		var securityUser = options.securityUser;
		var ormUser = options.ormUser;
		var quarryPassword = options.quarryPassword;
		
		var query = this;
			
		// we have the db user - loop the client user apis and line them up
		async.forEachSeries(securityUser.listApis(), function(api, nextApiCallback) {
					
			// tell the orm to link the api data
			ormUser.linkApi(api, securityUser.apiId(api), securityUser.apiData(api), function() {
					
				if(api=='quarry' && quarryPassword!=null) {
					// save the password into the orm
					ormUser.saveQuarryPassword(quarryPassword, nextApiCallback);
				} else {
					nextApiCallback();
				}
			});
					
		}, finishedCallback);
					
	};
		
	/*
	 * ask the request what it wants and then use the website registry to find the decision
	 */
	var run = function(broker, options, finishedCallback) {
			
		var registry = broker.get('accounts');
		var query = this;
		var securityUser = userClass.factory(options.user);
		
		var finishClosure = function(user) {
			finishedCallback(null, {
				user:user.rawData()
			});
		};
			
		// lets see if the user already exists on the client and is logging in again
		// (perhaps with a different api)
		//
		// the gatekeeper will have set the user id to the real id if it has already
		// got an answer
		registry.findUser(securityUser.id(), function(error, ormUser) {
				
			// so the client already knows about the db user
			if(ormUser) {
					
				linkOrmApis({
					securityUser:securityUser,
					ormUser:ormUser,
					quarryPassword:options.quarrypassword
				}, function() {
				
					// at this stage - we have linked all apis given by the client user
					// the orm user has got the most up-to date api-data cache also
					// we just need to flatten the orm user into the security user now
					finishClosure(ormUser.getSecurityUser());
						
				});
					
			}
			// the client has not passed a db id - either we must link the db via the api
			// or we must create a new installation
			else {
					
				// loop through the security user apis trying to find a user for that api id in the registry
				async.forEachSeries(securityUser.listApis(), function(api, nextApiCallback) {
						
					// ask the registry if it has a user for an api + id
					registry.findUser({
						api:api,
						id:securityUser.apiId(api)
					}, function(error, ormUser) {
							
						// we have found a user for the api - we don't need to make a new installation
						// just link the account
						if(ormUser) {
								
							console.log('plucked user from memory');
								
							linkOrmApis({
								securityUser:securityUser,
								ormUser:ormUser
							}, function() {
				
								// at this stage - we have linked all apis given by the client user
								// the orm user has got the most up-to date api-data cache also
								// we just need to flatten the orm user into the security user now
								finishClosure(ormUser.getSecurityUser());
									
							});
								
						} else {
								
							// lets try the next api to see if there is an orm user there
							nextApiCallback();
						}
							
					});
						
				}, function() {
						
					console.log('making installation');
					
					var createdUser = null;
					
					// if we get to here then we have not matched the security user api's against
					// what we have in the database and we have not seen this user before
					// so - make them an installation and create the user object fresh
					
					queryFactory(broker, 'accounts/createinstallation', {

						name:securityUser.name(),
						config:{}
				
					}, function(error, installation) {
							
						var createUserData = securityUser.createUserData();
							
						createUserData.installation_id = installation.id;
							
						var createDatabaseData = {
							name:'default',
							drive:'default',
							config:{},
							installation_id:installation.id
						};
							
						async.series([
							
							// first make the user object
							function(doneCallback) {
							
								queryFactory(broker, 'accounts/saveuser', createUserData, function(error, ormUser) {
										
									linkOrmApis({
										securityUser:securityUser,
										ormUser:ormUser
									}, function() {
						
										// at this stage - we have linked all apis given by the client user
										// the orm user has got the most up-to date api-data cache also
										// we just need to flatten the orm user into the security user now
										createdUser = ormUser.getSecurityUser();

										console.log('created user');
										doneCallback();
											
									});
										
								});
									
							},
								
							// then make the default database
							function(doneCallback) {
									
								console.log('creating database');
									
								queryFactory(broker, 'accounts/savedatabase', createDatabaseData, function(error, ormDatabase) {
										
									// the database is created
									doneCallback();
										
								});
									
							}
								
						], function() {
								
							// we are all setup now
							finishClosure(createdUser);
								
						});
							
					});
						
				});
					
			}
				
		});
			
			
			
	};
	
	return run;

});