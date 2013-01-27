/*
 * @class orm.database
 * @extends base
 * @filename   	orm/database.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * database orm class
 *
 * 
 * 
 * 
 *
 */

define([

	'system',
	
	'sequelize',
	
	'async',
	
	'component'
	
	
], function(

	systemClass,
	
	Sequelize,
	
	async,
	
	componentClass
	
) {
	
	var system = systemClass.instance();
	var database = system.database();
	
	var Database = database.define('database', {
	    name:Sequelize.STRING,
	    drive:Sequelize.STRING,
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
			
			// called the first time to get the installation created and setup
			install: function(config, allFinishedCallback) {
				
				allFinishedCallback();
				
			},
			
			setup: function(config, finishedCallback) {
				
				finishedCallback();
			},
			
			getRawData: function() {
				return {
					id:this.id,
					installation_id:this.installation_id,
					name:this.name,
					drive:this.drive,
					config:this.config
				};	
			}
		}
	});
	
	return Database;
	
	
});