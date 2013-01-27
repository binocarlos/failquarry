/*
 * @class security.guard
 * @filename   	security/guard.js
 * @package    	security
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry guard middleware for networked logins
 *
 */

define([

	'underscore',
	
	'bootlaceportals',
	
	'system',
	
	'async',
	
	'everyauth',
	
	'./user',
	
	'registry/query',
	
	'redis'
	
], function(

	_,
	
	bootlaceportals,
	
	systemClass,
	
	async,
	
	everyauth,
	
	userClass,
	
	queryFactory,
	
	redis
	
) {

	var system = systemClass.instance();
	
	
	// all users (logged in and temp) by their api id
	var apiUsers = {
		
	};
	
	// users against their id's
	// the id can be MySQL id or client generated id
	// both will point to the same object
	var globalUsers = {};
	
	var syncUsers = {};
	
	// a temp holding place for user id remapping
	var remapSessionIds = {};
	
	/*
	 * called by each API component - responsible for getting the user object from memory
	 * this might not exists in which case we create a placeholder which will be updated by the 
	 * final 'findUserById' function
	 *
	 * this expects:
	 *
	 * 		* session - the session object passed to the api middleware
	 *		* fullname - the name of the user extracted from the api data
	 *		* api - the name of the api logged in against
	 *		* apiId - the id extracted from the api - used to match quarry users
	 *		* apiData - the object of data provided by the api
	 */				
	function apiUser(data) {
	
		// grab a reference to the logged in session
		var session = data.session;
		
		// first make sure there is space in the map
		if(apiUsers[data.api]==null) {
			apiUsers[data.api] = {};
		}
		
		// then - check if we have a user already in memory against that api
		// e.g. apiUsers.facebook.12
		// we just return this if it's already there
		var user = apiUsers[data.api][data.apiId];
		
		// we don't have an in-memory user for that api and id
		// this means are going to hit the RPC server to line us up
		if(!user) {
			
			// here is where we look at the session to see if we have a quarry user already logged in
			// if they are logged in - then we are associating an api with a quarry user
			//console.log(data.session);
			if(data.session && data.session.auth && data.session.auth.userId) {
				user = globalUsers[data.session.auth.userId];
				
				if(!user) {
					user = userClass.factory({
						id:data.session.auth.userId
					});	
				}
			}
			// this means it is a new user ting
			else if(!user) {
				// if there is not a quarry user logged in at this point - then we are creating a new installation
				// for them
				user = userClass.factory({
					id:system.uuid(),
					name:data.name
				});
			}
			
			// add the api to the user data
			user.addApiData(data.api, data.apiData);
			user.addApiId(data.api, data.apiId);
			
			syncUsers[user.id()] = user;
		}
		
		return user;
		
	};
	
	/*
	 * called at the end of the middleware stack
	 * it's job is to resolve the system user from the userId passed by the middleware
	 * it checks the sync status of the user to see if it needs synching with the registry
	 */
	function findUser(registryClient, redisClient, clientUserId, foundUserCallback) {

		// if we don't have a global user - lets see if its a new one
		var syncUser = syncUsers[clientUserId];
		var globalUser = globalUsers[clientUserId];

		if(globalUser && !syncUser) {
			foundUserCallback(null, globalUser);
			return;
		}
		// this means we are going to hit the registry
		else {
			
			// do we already have a user to sync?
			if(!syncUser) {
				syncUser = userClass.factory({
					id:clientUserId
				});
				
				syncUsers[clientUserId] = syncUser;
			}
			
			registryClient.runQuery('security/ensureuser', {
  				user:syncUser.rawData()
			}, function(error, answer) {

				// we now have the answer back from the server
				// lets make sure it's mapped properly
				var dbUser = userClass.factory(answer.user);
						
				system.message('flash', 'Got New Registry User', clientUserId + ' -> ' + dbUser.id());
							
				// add the user to the proper map
				globalUsers[dbUser.id()] = dbUser;
					
				remapSessionIds[clientUserId] = dbUser.id();
					
				delete(syncUsers[clientUserId]);
							
				// now remap the new users api ids
				var userApis = dbUser.listApis();
							
				// now map the new users api's
				// this should probably be async
				for(var i in userApis) {
					var api = userApis[i];
					var apiId = dbUser.apiId(api);
						
					if(apiUsers[api]==null) {
						apiUsers[api] = {};
					}
						
					if(!_.isEmpty(api) && !_.isEmpty(apiId)) {
						apiUsers[api][apiId] = dbUser;
					}
				}
		
	  			foundUserCallback(null, dbUser);

	  		});
		}
	};
	
	/*
	 * change the session id onto the actual database user id
	 */
	var idRemapper = function(req, res, next) {
				
		if(req.session && req.session.auth) {
			var id = req.session.auth.userId;
			
			if(remapSessionIds[id]) {
				system.message('flash', 'Remapping Session User Id', id + ' -> ' + remapSessionIds[id]);
				req.session.auth.userId = remapSessionIds[id];
				delete(remapSessionIds[id]);
			}
		}

		next();
	};
	
	return bootlaceportals.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		name: 'security guard',
		
		/**
		 * the rpc registry client
		 *
		 */
		_registryClient: null,
		
		/**
		 * the redis client
		 *
		 */
		_redisclient: null,
		
		/**
		 * setup up the registry client object
		 *
		 */
		getObjectSetupFunctions: function() {
			
			// get the base setup functions
			var ret = this._super();
			
			var guard = this;
			
			// load the website registry server
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				guard.setupRegistryClient(callback);
				
			});
			
			// load the redis client for user ids
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				guard.setupRedisClient(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * setup the website registry client
		 *
		 */
		setupRegistryClient: function(callback) {
			
			var guard = this;
			
			this.message('header', 'Loading Registry Client');
			
			require(['client/rpc/registry'], function(registryClientClass) {
				
				var client = registryClientClass.factory();
				
				client.bind('ready', function() {
					
					guard._registryClient = client;
				
					callback();
				});
								
			});
			
		},
		
		/**
		 * setup the redis client
		 *
		 */
		setupRedisClient: function(callback) {
			
			var guard = this;
			
			this.message('header', 'Loading Redis Client');
			
			guard._redisclient = redis.createClient();
			
			callback();
			
		},
		
		/*
		 * entry method - set up a security guard on a connect app
		 */
		setupApp: function(app, config) {
			var guard = this;
			
			// setup the auth middleware
			app.use(guard.middleware(config));
  			
  			// setup the connect helpers
  			guard.setupAppHelpers(app);
  			
  			// setup the new user remapper (so we don't have a pseudo id in the session)
  			app.use(idRemapper);
		},
		
		/*
		 * apply the everyauth helpers to the connect app
		 */
		setupAppHelpers: function(app) {
			everyauth.helpExpress(app);
		},
		
		/*
		 * the return function - 
		 * accepts the config for what authentication to do
		 * this is set per server (with the API keys for that site)
		 */
		middleware: function(config) {
			
			var guard = this;
			
			// this is where we connect to the RPC server to create accounts if they
			// do not already exist
			//
			// the registry is responsible for creating/updating and returning the user object
			// if the gatekeeper does not have the user in the cache (as there maybe several gatekeepers running)
			// it MUST refer to the registry for the answer
			everyauth.everymodule.findUserById(function(userId, callback, test) {
				
				findUser(guard._registryClient, guard._redisclient, userId, callback);	
			});
			
			if(config.twitter) {
				everyauth.twitter
					.consumerKey(config.twitter.key)
					.consumerSecret(config.twitter.secret)
					.findOrCreateUser( function (session, accessToken, accessTokenSecret, twitterUserMetadata) {
						
						// make sure that user exists in the memory store
						var user = apiUser({
							session:session,
							name:twitterUserMetadata.name,
							api:'twitter',
							apiId:twitterUserMetadata.id,
							apiData:twitterUserMetadata
						});
						
						// return a reference to the memory store
						return {
							id:user.id()
						};
						
					})
					.redirectPath('/');
			}
			
			if(config.dropbox) {
				everyauth.dropbox
					.consumerKey(config.dropbox.key)
					.consumerSecret(config.dropbox.secret)
					.findOrCreateUser( function (session, accessToken, accessTokenSecret, dropboxUserMetadata) {
						
						system.log(dropboxUserMetadata);
						
						// make sure that user exists in the memory store
						var user = apiUser({
							session:session,
							name:dropboxUserMetadata.name,
							api:'dropbox',
							apiId:dropboxUserMetadata.id,
							apiData:dropboxUserMetadata
						});
						
						// return a reference to the memory store
						return {
							id:user.id()
						};
						
					})
					.redirectPath('/');
			}
			
			
			if(config.facebook) {
				everyauth.facebook
					.appId(config.facebook.id)
					.appSecret(config.facebook.secret)
					.findOrCreateUser( function (session, accessToken, accessTokenSecret, fbUserMetadata) {
						
						// make sure that user exists in the memory store
						var user = apiUser({
							session:session,
							name:fbUserMetadata.name,
							api:'facebook',
							apiId:fbUserMetadata.id,
							apiData:fbUserMetadata
						});
						
						// return a reference to the memory store
						return {
							id:user.id()
						};
					})
					.redirectPath('/');
			}
			
			if(config.password) {
  		
	  			everyauth.password
					.getLoginPath(config.password.login_path) // Uri path to the login page
					.postLoginPath(config.password.post_login_path) // Uri path that your login form POSTs to
				  	.loginView(config.password.login_view)
				  	.authenticate(function (login, password) {
				  		var promise = this.Promise();
				  		
				  		guard._registryClient.runQuery('security/loginquarryuser', {
				  					
					  		login:login,
					  		
					  		password:password
					  				
					  	}, function(error, loginResponse) {
				
							// have they logged in ok?
							if(!loginResponse.status) {
								
								promise.fulfill([loginResponse.error]);
								return;
							}
								
							// we now have the answer back from the server
							// lets make sure it's mapped properly
							var dbUser = userClass.factory(loginResponse.user);
								
							system.message('flash', 'Got Login User', dbUser.name());
										
							// add the user to the proper map
							globalUsers[dbUser.id()] = dbUser;
										
							// now remap the new users api ids
							var userApis = dbUser.listApis();
										
							// now map the new users api's
							// this should probably be async
							for(var i in userApis) {
								var api = userApis[i];
								var apiId = dbUser.apiId(api);
									
								if(apiUsers[api]==null) {
									apiUsers[api] = {};
								}
									
								if(!_.isEmpty(api) && !_.isEmpty(apiId)) {
									apiUsers[api][apiId] = dbUser;
								}
							}
								
							promise.fulfill({
								id:dbUser.id()
							});
				  		});
				  		
				  		return promise;
				  	})
				  	.loginSuccessRedirect(config.password.login_success_redirect)
				  	.getRegisterPath(config.password.register_path)
				  	.postRegisterPath(config.password.post_register_path)
				  	.registerView(config.password.register_view)
				  	.extractExtraRegistrationParams( function (req) {
				  		
				  		return {
				  			dbid:(req.session && req.session.auth && req.session.auth.userId) ? req.session.auth.userId : null,
				  			name:req.body.name
				  		};
					})
				  	.validateRegistration( function (newUserAttributes) {
				  		
				  		var promise = this.Promise();
				  		
				  		guard._registryClient.runQuery('security/checkquarryuser', {
				  					
					  		id:newUserAttributes.login
					  				
					  	}, function(error, loginResponse) {
					  		
							// this means there is already a quarry user with that login
							if(loginResponse.found) {
								return promise.fulfill(['there is already a user with that login']);
							}
					  			
							return promise.fulfill([]);
					  	});
					  	
					  	return promise;
				  	})
				  	.registerUser( function (newUserAttributes) {
				  	
				  		var promise = this.Promise();
				  		
				  		var syncUser = userClass.factory({
				  			// map the id either onto the session db id we already have or a new one
							id:newUserAttributes.dbid!=null ? newUserAttributes.dbid : system.uuid(),
							name:newUserAttributes.name
						});
						
						syncUser.addApiData('quarry', {
							id:newUserAttributes.login,
							name:newUserAttributes.name
						});
						
						syncUser.addApiId('quarry', newUserAttributes.login);
						
				  		// generate a new query to pass off to the server
					  	guard._registryClient.runQuery.factory('security/ensureuser', {
					  		
					  		'user':syncUser.rawData(),
					  		
					  		// we put the password here so it does not end up any where in the session
					  		'quarrypassword':newUserAttributes.password
					  				
					  	}, function(error, answer) {
			
							// we now have the answer back from the server
							// lets make sure it's mapped properly
							var dbUser = userClass.factory(answer.user);
								
							system.message('flash', 'Got New Registry User', syncUser.id() + ' -> ' + dbUser.id());
										
							// add the user to the proper map
							globalUsers[dbUser.id()] = dbUser;
										
							// now remap the new users api ids
							var userApis = dbUser.listApis();
										
							// now map the new users api's
							// this should probably be async
							for(var i in userApis) {
								var api = userApis[i];
								var apiId = dbUser.apiId(api);
									
								if(apiUsers[api]==null) {
									apiUsers[api] = {};
								}
									
								if(!_.isEmpty(api) && !_.isEmpty(apiId)) {
									apiUsers[api][apiId] = dbUser;
								}
							}
								
							promise.fulfill({
								id:dbUser.id()
							});
				  		
				  		});
				  		
				  		return promise;
				  	})
				  	.registerSuccessRedirect(config.password.register_success_redirect);
				  	
				  
	  			
	  		}
	  		
	  		/*
	  		everyauth.everymodule.handleLogout(function (req, res) {
	  			
				// Put you extra logic here
				req.logout(); // The logout method is added for you by everyauth, too
			
				// And/or put your extra logic here
				this.redirect(res, this.logoutRedirectPath());
			});
	  		*/
	  		
	  		
	  		return everyauth.middleware();
		}
	});
});