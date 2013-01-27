/*
 * @class 		registry.accounts
 * @singleton
 * @filename   	registry/accounts.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * accounts registry - singleton for managing installations and overall website stuff
 *
 * 
 *
 *
 */

define([

	'./registry',
	
	'underscore',
	
	'async',
	
	'system',
	
	'security/user'
	
	
], function(

	baseClass,
	
	_,
	
	async,
	
	systemClass,
	
	userClass
	
	
) {
	
	var system = systemClass.instance();
	
	var registryInstance = null;
	// the singleton bootstrap for the server system
	function bootstrapRegistry()
	{
		 return {
	        instance: function () { 
	        	return registryInstance!=null ? registryInstance : registryInstance = new theRegistryClass();
	        }
	    };
	}
	
	var theRegistryClass = baseClass.extend(
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
		name: 'accounts registry',
		
		/**
		 * installation by their id
		 *
		 */
		_installations:{},
		
		/*
		 * websites by their id
		 */
		_websites:{},
		
		/*
		 * websites by their domain
		 */
		_websiteDomainMap:{},
		
		/*
		 * websites by their installation_id -> array
		 */
		_websiteInstallationMap:{},
		
		/*
		 * databases by their id
		 */
		_databases:{},
		
		/*
		 * databases by their installation_id -> array
		 */
		_databaseInstallationMap:{},
		
		/*
		 * users by their username
		 */
		_users:{},
		
		/*
		 * users by their api keys - 2d - api name onto api id (e.g. facebook.12 = user)
		 */
		_userApiMap:{},
		
		/*
		 * a map of the orm classes
		 */
		_ormclasses:{},
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('registry.accounts');

			return ret;
		},
		
		/**
		 * load the websites
		 *
		 */
		getObjectSetupFunctions: function() {
			
			var ret = this._super();
			var registry = this;
			
			ret.push(function(callback) {
				
				// setup the website registry
				registry.loadORM(callback);
				
			});
			
			return ret;
		},
		
		/*
		 * load all of the data used by the accounts regsitry:
		 *
		 * 	* installations
		 *		* websites
		 *		* users
		 */
		loadORM: function(finishedCallback) {
			
			var registry = this;
			var database = system.database();
			
			registry.message('header', 'Loading Account Registry ORM Objects');

		
			// load the models we want to work with in this registry
			require(['orm/installation', 'orm/website', 'orm/user', 'orm/database'], function(Installation, Website, User, Database) {
				
				// assign the classes for later use
				registry._ormclasses = {
					installation:Installation,
					website:Website,
					user:User,
					database:Database
				};
				
				registry.message('event', 'orm', 'ORM Modules synchronized');
				
				async.series([
				
					function(nextSeries) {
						
						// now load the installations
						registry.message('event', 'orm', 'Loading Installations');
						
						Installation.findAll().success(function(installations) {
						
							async.forEachSeries(installations, function(installation, nextInstallationCallback) {
						
								installation.setup({}, function() {
									registry.addInstallation(installation, nextInstallationCallback);
								});
								
							}, nextSeries);
						
						});
					},
					
					function(nextSeries) {
					
				
						// now load the websites
						registry.message('event', 'orm', 'Loading Websites');
						
						Website.findAll().success(function(websites) {
						
							async.forEachSeries(websites, function(website, nextWebsiteCallback) {
								registry.addWebsite(website, function() {
									website.setup({}, nextWebsiteCallback);
								});
							}, nextSeries);
						
						});
					},
				
					function(nextSeries) {
				
						// now load the users
						registry.message('event', 'orm', 'Loading Users');
						
						User.findAll().success(function(users) {
						
							async.forEachSeries(users, function(user, nextUserCallback) {
								registry.addUser(user, function() {
									user.setup({}, nextUserCallback);
								});
							}, nextSeries);
						
						});
					},
				
					function(nextSeries) {
				
						// now load the users
						registry.message('event', 'orm', 'Loading Databases');
						
						Database.findAll().success(function(databases) {
						
							async.forEachSeries(databases, function(database, nextDatabaseCallback) {
								registry.addDatabase(database, function() {
									database.setup({}, nextDatabaseCallback);
								});
							}, nextSeries);
						
						});
					}
				], function() {
					finishedCallback();
				})
			});
			
		},
		
		/*
		 * grab the orm class for an installation/website etc
		 */
		ormclass: function(name) {
			return this._ormclasses[name];
		},
	
		/*
		 * called on an installation we have just loaded from the database
		 * it will setup the installation and then stick it into the cache
		 */
		addInstallation: function(installation, addedCallback) {
			
			var registry = this;
			
			registry._installations[installation.id] = installation;
				
			system.message('data', 'Installation: ' + installation.name);
			
			addedCallback();
		},
		
		getInstallationRoot: function(id) {
			var installation = this._installations[id];
			
			return installation.root;
		},
		
		getInstallation: function(id) {
			return this._installations[id];
		},
		
		/*
		 * give me some websites please
		 */
		listWebsites: function(config, callback) {
			
			var registry = this;
			
			var installation_id = null;
			
			if(config.installation_id) {
				installation_id = config.installation_id;
			} else if(config.user_id) {
				var user = registry._users[config.user_id];
				installation_id = user.installation_id;
			}
			
			var arr = registry._websiteInstallationMap[installation_id];
			
			var websiteList = _.map(arr, function(website) {
				return website.getRawData();
			});
			
			callback(null, websiteList);
		},
		
		/*
		 * give me some databases please
		 */
		listDatabases: function(config, callback) {
			
			var registry = this;
			
			var installation_id = null;
			
			if(config.installation_id) {
				installation_id = config.installation_id;
			} else if(config.user_id) {
				var user = registry._users[config.user_id];
				installation_id = user.installation_id;
			}
			
			var arr = registry._databaseInstallationMap[installation_id];
			
			var databaseList = _.map(arr, function(database) {
				return database.getRawData();
			});
			
			callback(null, databaseList);
		},
		
		updateWebsite: function(website, oldDomains, updatedCallback) {
			
			var registry = this;
			
			system.message('data', 'Update Website: ' + website.name);
			
			async.forEach(oldDomains, function(oldDomain, nextDomainCallback) {
									
				system.message('subdata', 'Remove Domain: ' + oldDomain);
				delete(registry._websiteDomainMap[oldDomain]);
										
				nextDomainCallback();
										
			}, function() {
				async.forEach(website.domainArray(), function(websiteDomain, nextDomainCallback) {
									
					system.message('subdata', 'Add Domain: ' + websiteDomain);
					registry._websiteDomainMap[websiteDomain] = website;
											
					nextDomainCallback();
											
				}, updatedCallback);
			});
			
		},
		
		/*
		 * add website by it's domains
		 */
		addWebsite: function(website, addedCallback) {
			
			var registry = this;
			
			system.message('data', 'Website: ' + website.name);
			
			registry._websites[website.id] = website;
			
			var installation = registry._installations[website.installation_id];
			
			if(!installation) {
				throw new Error('There is no installation for website: ' + website.id + ' - ' + website.installation_id);
			}
			
			// add the website to the list of this installation
			if(registry._websiteInstallationMap[installation.id]==null) {
				registry._websiteInstallationMap[installation.id] = [];
			}
			
			registry._websiteInstallationMap[installation.id].push(website);
			
			// give the website the installations root folder (and anything else website wants to know)
			website.installationRoot(installation.root);

			async.forEach(website.domainArray(), function(websiteDomain, nextDomainCallback) {
									
				system.message('subdata', 'Domain: ' + websiteDomain);
				registry._websiteDomainMap[websiteDomain] = website;
										
				nextDomainCallback();
										
			}, addedCallback);
		},
		
		/*
		 * finds a website from the given hostname
		 * will look in the cache to see if we have found this website before
		 * if not then search through each of the websites doing a match on the domains
		 */
		findWebsite: function(query, finishedCallback) {
			
			if(!query) {
				query = '';
			}
			
			var registry = this;
			
			if(!query.match(/\w/)) {
				finishedCallback(null, null);				
			}
			
			// check if the query is actually an id
			if(query.match(/^\d+$/)) {
				finishedCallback(null, registry._websites[query]);
				return;
			}
			
			this.convertHostname(query.toLowerCase(), function(error, useHostname) {
				
				finishedCallback(error, registry._websiteDomainMap[useHostname]);
				
			});
		},
		
		/*
		 * loads the website component and then lists the drive names the website can use (by loading the websites/databases etc from the installation)
		 */
		getWebsiteProfile: function(id, finishedCallback) {
			var registry = this;
			
			var website = registry._websites[id];
			var installation_id = website.installation_id;
			
			var websiteArr = registry._websiteInstallationMap[installation_id];
			var databaseArr = registry._databaseInstallationMap[installation_id];
			
			var drives = {};
			
			_.forEach(websiteArr, function(foundWebsite) {
				drives[website.drive] = {
					supplier:'filesystem',
					config:{
						location:foundWebsite.documentRoot()
					}
				}
			});
			
			_.forEach(databaseArr, function(database) {
				drives[database.drive] = {
					supplier:'database',
					config:{
						id:database.id
					}
				}
			});
			
			// the default website connection
			drives.website = {
				supplier:'filesystem',
				config:{
					location:website.documentRoot()
				}
			};
			
			var defaultDatabase = databaseArr[0];
			
			if(defaultDatabase) {
				// the default database connection
				drives.database = {
					supplier:'database',
					config:{
						id:defaultDatabase.id
					}
				};
			}

			finishedCallback(null, {
				drives:drives
			});

		},
		
		/*
		 * used to make sure that the given domains are not owned by another website
		 * pass the existingArray is the website is being updated to prevent it's own domains triggering
		 */
		checkDomains: function(domainArray, existingArray, statusCallback) {
			// assume no existing passed
			if(existingArray && !statusCallback) {
				statusCallback = existingArray;
				existingArray = [];
			}
			
			var existingMap = {};
			var registry = this;
			
			async.series([
				function(nextSeries) {
					async.forEach(existingArray, function(existingDomain, nextDomain) {
						existingMap[existingDomain] = true;
						nextDomain();
					}, nextSeries);
				},
				function(nextSeries) {
					async.forEach(domainArray, function(checkDomain, nextDomain) {
						
						if(registry._websiteDomainMap[checkDomain] && !existingMap[checkDomain]) {
							
							// we have found the domain and it is not already for that website
							statusCallback("domain already taken");
							return;
						} else {
							
							nextDomain();
						}
						
					}, nextSeries);
				}
			], function() {
				// we have checked all the domains and have not found a hit - we are ok
				statusCallback();
			});
			
		},
		
		getWebsite: function(id) {
			return this._websites[id];
		},
		
		/*
		 * add database by it's installation id
		 */
		addDatabase: function(database, addedCallback) {
			
			var registry = this;
			
			system.message('data', 'Database: ' + database.name);
			
			registry._databases[database.id] = database;
			
			var installation = registry._installations[database.installation_id];
			
			if(!installation) {
				throw new Error('There is no installation for database: ' + database.id + ' - ' + database.installation_id);
			}
			
			// add the website to the list of this installation
			if(registry._databaseInstallationMap[installation.id]==null) {
				registry._databaseInstallationMap[installation.id] = [];
			}
			
			registry._databaseInstallationMap[installation.id].push(database);
			
			addedCallback();
		},
		
		updateDatabase: function(database, updatedCallback) {
			updatedCallback();
		},
		
		getDatabase: function(id) {
			return this._databases[id];
		},
		
		/*
		 * add user to api maps
		 */
		addUser: function(user, addedCallback) {
		
			var registry = this;
			
			system.message('data', 'User: ' + user.name);
			registry._users[user.id] = user;
			
			var userApis = user.apiKeys();
			
			// loop through each API the user has add add it to the map
			async.forEachSeries(_.keys(userApis), function(api, nextApiCallback) {
				registry.addUserApiToDataStructure(user, {
					api:api,
					id:userApis[api]
				}, nextApiCallback);
			}, addedCallback);
		},
		
		/*
		 * add user to single api map
		 */
		addUserApiToDataStructure: function(user, apiInfo, addedCallback) {
			
			var registry = this;
			
			system.message('subdata', 'API: ' + apiInfo.id + '@' + apiInfo.api);
			
			// ensure space in the map
			if(!registry._userApiMap[apiInfo.api]) {
				registry._userApiMap[apiInfo.api] = {};
			}
			
			registry._userApiMap[apiInfo.api][apiInfo.id] = user;
			
			addedCallback();
		},
		
		/*
		 * finds a user
		 * you can give it an id or any combination of api ids as {api:'facebook':id:12}
		 */
		findUser: function(query, finishedCallback) {
			
			var registry = this;
			
			if(_.isObject(query)) {
				// ensure space in the api map
				if(!registry._userApiMap[query.api]) {
					registry._userApiMap[query.api] = {};
				}
				
				finishedCallback(null, registry._userApiMap[query.api][query.id]);
			}
			// assume query to be user id
			else {
				finishedCallback(null, registry._users[query]);
			}
			
			
		},
		
		getUser: function(id) {
			return this._users[id];
		},
		
		/*
		 * quick find the users install id - sync
		 */
		getUserInstallationId: function(user_id) {
			var user = this._users[user_id];
			
			return user.installation_id;
		},
		
		/*
		 * see if the hostname ends with a root domain - and replace it with .quarry if so
		 * (this is how bob.quarry can match bob.rootdomain1.com AND bob.otherdomain.com)
		 */
		convertHostname: function(hostname, convertedCallback) {
			
			var rootDomains = system.config('domains');
			var foundRootDomain = null;
			
			async.some(rootDomains, function(rootDomain, statusCallback) {
			
				// does the asked for hostname end with a root domain (and it's not just a root domain)
				var status = hostname!=rootDomain && hostname.indexOf(rootDomain, hostname.length - rootDomain.length) !== -1
				
				if(status) {
					foundRootDomain = rootDomain;
				}
				statusCallback(status);
				
			}, function(foundStatus) {
				
				if(foundStatus) {
					hostname = hostname.replace('.' + foundRootDomain, '');
				}
				
				convertedCallback(null, hostname);
				
			});
		},
		
		validateSubdomain: function(subdomain, finishedCallback) {
		
			var registry = this;
			
			async.series({
			    website: function(callback){
			    	registry.findWebsite(requestData.subdomain + '.quarry', function(error, website) {
			    		callback(null, website);	
			    	});
			    }
        	},
        	// if we have either a website or a user then we can't make the installation
        	function(error, results) {
        		
        		if(results.website) {
        			finishedCallback('There is already a website with that subdomain');
        			return;
        		}
        		
        		finishedCallback(null);
        		
        	});	
		}
	
		
	});
	
	return bootstrapRegistry();
	
});