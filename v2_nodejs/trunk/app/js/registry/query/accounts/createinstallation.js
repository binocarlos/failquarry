/*
 * @class 		registry.query.accounts.createaccount
 * @singleton
 * @filename   	registry/query/accounts/createaccount.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * creates a new installation
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
	 * make a new installation - install it and return
	 *
	 * the config for this query:
	 *
	 * 	* name - of the installation
	 *	* config - and object written as a JSON string to the installation
	 */
	return function(broker, options, finishedCallback) {
			
		var registry = broker.get('accounts');
			
		var installationClass = registry.ormclass('installation');
		
		var config = options.config || {};
			
		var installationData = {
			name:options.name,
			root:'installation:/' + system.uuid(true),
			config:JSON.stringify(config)
		};
			
		installationClass.create(installationData).success(function(installation) {
				
			// now we have the installation in the database - install it (this creates the folder)
			installation.install({}, function(error) {
					
				// the installation is now created in the database and the folder is created
				// lets add it to the registry before we callback
				registry.addInstallation(installation, function(error) {
						
					finishedCallback(error, installation);		
				});
						
			});
		});
			
	};

});