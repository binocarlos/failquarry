/*
 * @class 		server.http.reception.controller.account
 * @filename   	server/http/reception/controller/account.js
 * @package    	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * account controller
 *
 *
 *
 */

define([

	'async',
	
	'system',
	
	'underscore',
	
	'component/server/request',
	
	'registry/query'
	
], function(

	async,
	
	systemClass,
	
	_,
	
	websiteRequest,
	
	queryFactory
	
	
	
) {
	
	// get a reference to the server system
	var system = systemClass.instance();
	
	var actions = function() {
		
		/*
		 * splits dependent on the login status
		 */
		this.homepageData = function(registryClient) {
			return function(req, res, next) {
  				registryClient.runQuery('reception/home', {
  					user_id:req.user.id()
			  	}, function(error, answer) {
			  		res.json(JSON.stringify(answer));
		  		});
		  	}
  		};
  		
  		this.saveWebsite = function(registryClient) {
  			
  			return function(req, res, next) {
  		
  				// lets load the websites via RPC
  				registryClient.runQuery('reception/savewebsite', {
  					name:req.body.name,
					domains:req.body.subdomain,
					
					website_id:req.body.website_id,
			  		user_id:req.user.id()
			  	}, function(error, answer) {
			  		res.json(JSON.stringify({
						status:answer.error==null,
			  			error:answer.error
			  		}));
		  		});
		  	}
		  	
  		};
  		
  		this.saveDatabase = function(registryClient) {
  			
  			return function(req, res, next) {
  				
  				registryClient.runQuery('reception/savedatabase', {
  					name:req.body.name,
					drive:req.body.drive,
					
					database_id:req.body.database_id,
			  		user_id:req.user.id()
			  	}, function(error, answer) {
			  		res.json(JSON.stringify({
						status:answer.error==null,
			  			error:answer.error
			  		}));
		  		});
  			}
  			
  		};
  		
		
	};
	
	return new actions();
	
});