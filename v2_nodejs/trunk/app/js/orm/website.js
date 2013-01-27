/*
 * @class orm.website
 * @extends base
 * @filename   	orm/website.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * website orm class
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
	
	'component',
	
	'robject'
	
	
], function(

	systemClass,
	
	Sequelize,
	
	async,
	
	componentClass,
	
	robject
	
) {
	
	var system = systemClass.instance();
	var database = system.database();
	
	var Website = database.define('website', {
	    name:Sequelize.STRING,
	    drive:Sequelize.STRING,
	    root:Sequelize.STRING,
	    domains:Sequelize.STRING,
	    ftp_username:Sequelize.STRING,
	    ftp_password:Sequelize.STRING,
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
			
			/*
			 * a website component used for file lookups
			 */
			_component:null,
			
			/*
			 * set by the installation upon creation
			 */
			_installation_root:null,
			
			/*
			 * the processed website domains
			 */
			 _domainarray:null,
			
			/*
			 * the robject config
			 */ 
			 _config:null,
			
			domainArray: function() {
				return this.domains.split(',');
			},
			
			installationRoot: function(newVal) {
				return newVal!=null ? this._installation_root = newVal : this._installation_root;
			},
			
			documentRoot: function() {
				return [this.installationRoot(), this.root].join('/');
			},
			
			// called the first time to get the installation created and setup
			install: function(config, allFinishedCallback) {
				
				var website = this;
				
				website.installationRoot(config.installation_root);
				
				// get the website setup with a component
				website.setup({
					
				}, function() {
					
					// now tell the component to install itself
					website._component.install(function() {
						allFinishedCallback();
					});
					
				});
				
			},
			
			setup: function(config, finishedCallback) {
				
				var website = this;
				
				// set up the robject config
				website._config = robject.factory(JSON.parse(website.config));
				
				// now the domains are processed - load the website component
				website.loadComponent(finishedCallback);
				
			},
			
			/*
			 * generate a website component from this ORM (cached)
			 */
			loadComponent: function(finishedCallback) {
				
				var website = this;
				
				componentClass.factory({
					type:'website',
					location:website.documentRoot(),
					config:website._config.rawData()
				}, function(error, websiteComponent) {
					
					website._component = websiteComponent;
					
					finishedCallback(null, website._component);
					
				});
			},
			
			/*
			 * proxy through to the website component to find
			 */
			getRoutingDecision: function(request, returnCallback) {
				var website = this;
				
				this._component.getRoutingDecision(request, function(error, decision) {
					
					// add the installation_id onto the routing decision
					decision.installation_id = website.installation_id;
					decision.website_id = website.id;
					
					returnCallback(error, decision);
				});
			},
			
			getRawData: function() {
				return {
					id:this.id,
					installation_id:this.installation_id,
					name:this.name,
					root:this.root,
					ftp_username:this.ftp_username,
					ftp_password:this.ftp_password,
					domains:this.domains,
					config:this.config
				};	
			}
		}
	});
	
	return Website;
	
	
});