/*
 * @class orm.installation
 * @extends base
 * @filename   	orm/installation.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * installation orm class
 *
 * 
 * 
 * 
 *
 */

define([

	'system',
	
	'sequelize',
	
	'./user',
	
	'./website',	
	
	'./database',
	
	'async'
	
], function(

	systemClass,
	
	Sequelize,
	
	User,
	
	Website,
	
	Database,
	
	async
	
) {
	
	
	var system = systemClass.instance();
	var database = system.database();
	
	var Installation = database.define('installation', {
	    name:Sequelize.STRING,
	    root:Sequelize.STRING,
	    config:Sequelize.STRING
	},{
		engine: 'InnoDB',
		charset: 'utf8',
  		collate: 'utf8_general_ci',
		timestamps: false,
		paranoid: true,
		underscored: true,
		freezeTableName: true,
		
		classMethods:{
			
			
		},
		
		instanceMethods:{

			// make sure the installation folder exists
			install: function(config, allFinishedCallback) {
				
				var installation = this;
				
				var installFunctions = [];
				
				// the first thing we want to do is create the installation folder
				installFunctions.push(function(finishedCallback) {
					
					system.ensurePathExists(installation.root, function(error) {
						
						allFinishedCallback(error);
						
					});
						
				});
				
				async.series(installFunctions, allFinishedCallback);
			},
			
			// nothing to do here - installation is pretty simple
			setup: function(config, finishedCallback) {
				
				// the data has been loaded
				finishedCallback();
				
			}
			
		}
	});
	
	Installation.hasMany(User, {as: 'Users'});
	Installation.hasMany(Website, {as: 'Websites'});
	Installation.hasMany(Database, {as: 'Databases'});
	User.belongsTo(Installation);
	Website.belongsTo(Installation);
	Database.belongsTo(Installation);
	
	return Installation;
	
	
});