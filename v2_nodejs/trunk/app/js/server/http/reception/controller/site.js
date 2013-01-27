/*
 * @class 		server.http.reception.controller.site
 * @filename   	server/http/reception/controller/site.js
 * @package    	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * overall website controller
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
	
	queryClass
	
	
	
) {
	
	// get a reference to the server system
	var system = systemClass.instance();
	
	var actions = function() {
		
		/*
		 * splits dependent on the login status
		 */
		this.index = function(registryClient) {
			
			var controller = this;
			
			return function(req, res, next) {
  			
	  			if(req.user) {
	  				controller.accountIndex(registryClient)(req, res, next);
	  				
	  			} else {
	  				controller.normalIndex()(req, res, next);
	  			}
	  			
	  		}
  				
  		};
  		
  		/*
		 * normal home page
		 */
  		this.normalIndex = function() {
  			
  			return function(req, res, next) {
  		
  				res.render('index.htm');
  		
  			}
  			
  		};
  		
  		/*
		 * account home page
		 */
  		this.accountIndex = function(registryClient) {
  			
  			return function(req, res, next) {
  		
  				res.render('account/index.htm');
  		
  			}
  			
  		
  		};
  		
  		/*
		 * a static page - translates uri onto view name (/about -> about.htm --- /about/hello -> about/hello.htm)
		 */
  		this.staticpage = function() {
  			
  			return function(req, res, next) {
  				
  				var request = websiteRequest.reqfactory(req);
  				var template = request.pathname().replace(/^\//, '') + '.htm';
  				
  				res.render(template);
  			}
  		};
  		
  		/*
  		 * the 404
  		 */
  		this.status404 = function() {
  			
  			return function(req, res, next) {
  				
  				res.render('404.htm');
  				
  			}
  				
  		};
		
	};
	
	return new actions();
	
});