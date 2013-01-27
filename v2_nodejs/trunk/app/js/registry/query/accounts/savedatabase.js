/*
 * @class 		registry.query.accounts.savedatabase
 * @singleton
 * @filename   	registry/query/accounts/savedatabase.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * creates a new database
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
		
	var updateDatabase = function(broker, options, finishedCallback) {
			
		var registry = broker.get('accounts');
			
		var databaseClass = registry.ormclass('database');
			
		var query = this;
			
		var installation_id = registry.getUserInstallationId(options.user_id);
			
		var database = registry.getDatabase(options.database_id);
			
		if(!database) {
			finishedCallback("no database with id: " + options.database_id);
			return;
		}
			
		if(database.installation_id!=installation_id) {
			finishedCallback("database does not belong to user");
			return;
		}
			
		database.name = options.name;
		database.drive = options.drive;
		database.config = JSON.stringify(options.config || {});
			
		database.save().success(function() {
				
			registry.updateDatabase(database, function(error) {
						
				finishedCallback(error, database);		
			});
				
		}).error(function(err) {
			finishedCallback(err);
		});
	};
		
	/*
	 * make a new database - install it and return
	 *
	 * the config for this query:
	 *
	 * 	* name - of the database
	 *	* drive - of the database
	 *	* config - and object written as a JSON string to the installation
	 */
	var createDatabase = function(broker, options, finishedCallback) {
			
		var registry = broker.get('accounts');
			
		var databaseClass = registry.ormclass('database');
			
		var query = this;
			
		var installation_id = options.user_id ? registry.getUserInstallationId(options.user_id) : options.installation_id;
			
		var databaseData = {
			name:options.name,
			drive:options.drive,
			config:JSON.stringify(options.config || {}),
			installation_id:installation_id
		};
			
		var installation = registry._installations[options.installation_id];
			
		console.log('creating db');
		console.log(databaseData);
			
		databaseClass.create(databaseData).success(function(database) {

			database.install({
					
					
			}, function(error) {

				registry.addDatabase(database, function(error) {
					
					finishedCallback(error, database);		
				});
						
			});
		}).error(function(err) {
			console.log(err);
		});
			
	};
	
	var run = function(broker, options, finishedCallback) {
			
		if(options.database_id) {
			updateDatabase(broker, options, finishedCallback);
		} else {
			createDatabase(broker, options, finishedCallback);
		}
	};
	
	return run;

});