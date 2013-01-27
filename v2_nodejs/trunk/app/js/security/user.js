/*
 * @class 		security.user
 * @singleton
 * @filename   	security/user.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * lightweight client (both server RPC client and actual client) representation of a user
 * this will NEVER have any sensitive data
 *
 * 
 *
 *
 */



define([

	'base/objectbase',
	
	'underscore'
	
], function(

	baseClass,
	
	_
	
) {
	
	// our base class is an events emitter
	return baseClass.extend(
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
		
		id: function() {
			return this.get('id');
		},
		
		name: function() {
			return this.get('name');
		},
		
		img: function(api) {
			if(api) {
				return this.getApiImg(api);
			}
			
			var allApis = this.listApis();
			
			if(allApis.facebook) {
				return this.getApiImg('facebook');
			} else if(allApis.twitter) {
				return this.getApiImg('twitter');
			}
			else {
				return null;
			}
		},
		
		getApiImg: function(api) {
			if(api=='facebook') {
				return 'http://graph.facebook.com/' + this.apiId('facebook') + '/picture';
			} else if(api=='twitter') {
				var meta = this.apiData('twitter');
				return meta.profile_image_url;
			}
			
			return null;
		},
		
		getApiName: function(api) {
			var data = this.apiData(api);
			if(api=='facebook') {
				return data.name;
			} else if(api=='twitter') {
				return data.name;
			} else if(api=='dropbox') {
				return data.display_name;
			}
			
			return null;
		},
		
		listApis: function() {
			return _.keys(this.rawApis());
		},
		
		rawApis: function() {
			return this.get('api') || {};
			
		},
		
		hasApi: function(name) {
			return this.get('api.' + name)!=null;
		},
		
		apiData: function(name) {
			return this.get('api.' + name);
		},
		
		apiId: function(name) {
			return this.get('apiid.' + name);
		},
		
		addApiId: function(api, id) {
			this.set('apiid.' + api, id);	
		},
		
		addApiData: function(api, data) {
			this.set('api.' + api, data);	
		},
		
		// method to get the ORM data to create from a request
		createUserData: function() {
			var ret = {
				name:this.name()
			};
			
			var apis = this.listApis();
			
			for(var i in apis) {
				var api = apis[i];
				
				ret[api] = this.apiId(api);
			}
			
			// make sure we assign the quarry password
			if(this.hasApi('quarry')) {
				
				var quarryConfig = this.apiData('quarry');
				
				ret.quarrypassword = quarryConfig.password;		
			}
			
			return ret;
		}
		
		
		
		
	});
	
	return base;
	
});