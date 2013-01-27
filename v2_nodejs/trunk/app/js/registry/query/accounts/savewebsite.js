/*
 * @class 		registry.query.accounts.savewebsite
 * @singleton
 * @filename   	registry/query/accounts/savewebsite.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * saves or creates a new website
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'../../query',
	
	'async',
	
	'system'
	
], function(

	_,
	
	base,
	
	async,
	
	systemClass
	
) {
	
	var system = systemClass.instance();
		
	/*
	 * update an existing website
	 *
	 * the config for this query:
	 *
	 * 	* name - of the installation
	 *	* config - and object written as a JSON string to the installation
	 */
	var updateWebsite = function(broker, options, finishedCallback) {
		var registry = broker.get('accounts');
			
		var websiteClass = registry.ormclass('website');
			
		var query = this;
			
		var installation_id = registry.getUserInstallationId(options.user_id);
			
		var website = registry.getWebsite(options.website_id);
			
		if(!website) {
			finishedCallback("no website with id: " + options.website_id);
			return;
		}
			
		if(website.installation_id!=installation_id) {
			finishedCallback("website does not belong to user");
			return;
		}
			
		// keep the old data in case we error
		var oldData = {
			domainArray:website.domainArray(),
			domains:website.domains,
			name:website.name,
			config:website.config
		};
			
		// restore function if it goes wrong
		var restoreWebsite = function() {
			website.name = oldData.name;
			website.domains = oldData.domains;
			website.config = oldData.config;
		};
			
		// first lets check the domains are not taken
		registry.checkDomains(options.domains.split(','), oldData.domains, function(error) {
				
			// do we have a domain error?
			if(error) {
				finishedCallback(error);
				return;
			}
				
			website.name = options.name;
			website.domains = options.domains;
			website.config = JSON.stringify(options.config || {});
				
			website.save().success(function() {
				
				registry.updateWebsite(website, oldData.domains, function(error) {
							
					if(error) {
						restoreWebsite();
					}
						
					finishedCallback(error, website);		
				});
					
			}).error(function(err) {
				restoreWebsite();
				finishedCallback(err);
			});
				
		});
			
	};
		
	/*
	 * make a new website - install it and return
	 *
	 * the config for this query:
	 *
	 * 	* name - of the installation
	 *	* domains - the subdomains / full domains - comma seperated
	 *	* config - and object written as a JSON string to the installation
	 */
	var createWebsite = function(broker, options, finishedCallback) {
			
		var registry = broker.get('accounts');
			
		var websiteClass = registry.ormclass('website');
			
		var query = this;
			
		// first lets check the domains are not taken
		registry.checkDomains(options.domains.split(','), function(error) {
				
			// do we have a domain error?
			if(error) {
				finishedCallback(error);
				return;
			}
			
			var installation_id = options.user_id ? registry.getUserInstallationId(options.user_id) : options.installation_id;
			var installation_root = registry.getInstallationRoot(installation_id);
				
			var website_root = system.uuid(true);
				
			var websiteData = {
				name:options.name,
				drive:options.drive,
				root:website_root,
				domains:options.domains,
				ftp_username:(installation_root.split(':/')[1]) + '/' + website_root,
				ftp_password:system.uuid(true),
				config:JSON.stringify(options.config || {}),
				installation_id:installation_id
			};
				
			var installation = registry._installations[installation_id];
				
			websiteClass.create(websiteData).success(function(website) {
					
				// now we have the installation in the database - install it (this creates the folder)
				website.install({
					installation_root:installation_root
						
				}, function(error) {
						
					// the website is now created in the database and the folder is created
					// lets add it to the registry before we callback
					registry.addWebsite(website, function(error) {
							
						finishedCallback(error, website);		
					});
							
				});
			});
		});
			
	};
	
	var run = function(broker, options, finishedCallback) {
			
		if(options.website_id) {
			updateWebsite(broker, options, finishedCallback);
		} else {
			createWebsite(broker, options, finishedCallback);
		}
	};
	
	return run;

});