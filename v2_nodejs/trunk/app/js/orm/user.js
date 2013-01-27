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
	
	'underscore',
	
	'security/user'
	
	
], function(

	systemClass,
	
	Sequelize,
	
	_,
	
	securityUserClass
	
) {
	
	var useApis = ['facebook', 'twitter', 'quarry'];
	
	var system = systemClass.instance();
	var database = system.database();
	
	var User = database.define('user', {
	    name:Sequelize.STRING,
	    quarrypassword:Sequelize.STRING,
	    quarry:Sequelize.STRING,
	    quarrymeta:Sequelize.STRING,
	    facebook:Sequelize.STRING,
	    facebookmeta:Sequelize.STRING,
	    twitter:Sequelize.STRING,
	    twittermeta:Sequelize.STRING,
	    dropbox:Sequelize.STRING,
	    dropboxmeta:Sequelize.STRING
	},{
		engine: 'InnoDB',
		charset: 'utf8',
  		collate: 'utf8_general_ci',
		timestamps: false,
		paranoid: true,
		underscored: true,
		freezeTableName: true,
		
		classMethods:{
			
			apis: function() {
				return useApis;
			}
			
		},
		
		instanceMethods:{
			
			/*
			 * map of api name onto their user data
			 * this is written as new logins are found
			 */
			_apiData:{},
			
			setup: function(config, finishedCallback) {
				
				for(var i in useApis) {
					var api = useApis[i];
					if(this[api]!=null) {
						var data = JSON.parse(this[api+'meta']);
						
						this.addApiData(api, data);
					}
				}
				
				finishedCallback();
				
			},
			
			hasApi: function(api) {
				return !_.isEmpty(this[api]);
			},
			
			/*
			 * add some api user data to the global user store
			 */
			addApiData: function(api, data) {
				this._apiData[api] = data;
			},
			
			/*
			 * get the api data for this user
			 */
			getApiData: function(api) {
				return api!=null ? this._apiData[api] : this._apiData;
			},
			
			/*
			 * return an object of 
			 * {facebook:12,
			 *	twitter:123}
			 */
			apiKeys: function() {
				
				var ret = {};
				
				for(var i in useApis) {
					var api = useApis[i];
					if(this[api]!=null) {
						ret[api] = this[api];
					}
				}
				
				return ret;
			},
			
			/*
			 * link the given api name to this user
			 * 
			 */
			linkApi: function(api, id, data, finishedCallback) {
				this[api] = id;
				if(data) {
					this[api+'meta'] = JSON.stringify(data);
					this.addApiData(api, data);
				}
				this.save().success(finishedCallback);
			},
			
			saveQuarryPassword: function(password, finishedCallback) {
				this.quarrypassword = password;
				this.save().success(finishedCallback);
			},
			
			/*
			 * flattens this ORM into a security user
			 * the orm user is the central store in the registry
			 * each time a new api is found for it - the ORM is saved
			 * and fully exported - this means that even if the link request
			 * came from a server where the original user was not returned to
			 * (i.e. in a cluster) - the next link (with a different api) will
			 * return the full orm version which will have both apis in it
			 * p.s. this is the worst document I have ever written
			 */
			getSecurityUser: function() {
				
				return securityUserClass.factory({
					id:this.id,
					name:this.name,
					api:this._apiData,
					apiid:this.apiKeys()
				});
			}
		}
	});
	
	return User;
	
	
});