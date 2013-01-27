/*
 * @class 		server.http.reception
 * @extends		server.http
 * @filename   	server/http/reception.js
 * @package    	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry reception server - express app to take registrations
 *
 *
 *
 */

define([

	'../http',
	
	'async',
	
	'system',
	
	'underscore',
	
	'express',
	
	'security/guard',
	
	'security/user',
	
	'./reception/controller/site',
	
	'./reception/controller/account',
	
	'component/server/request',
	
	'connect-redis'
	
], function(

	http,
	
	async,
	
	systemClass,
	
	_,
	
	express,
	
	securityGuard,
	
	userClass,
	
	siteController,
	
	accountController,
	
	websiteRequest,
	
	// the redis session store
	connectRedis
	
	
) {
	
	// get a reference to the server system
	var system = systemClass.instance();
	
	// a closure function so we can pass variables from the view to the layout
	var layoutProperty = function () {
    	var value = null;
    	return {
	        get: function () {
         	  	return value;
        	},
        	set: function (new_value) {
           		value = new_value;
        	}
    	};
	};
	
	var layoutPropertyCreator = function () {
    	return function () {
        	return layoutProperty();
    	};
	};
	
	return http.extend(
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
		name:'Reception Server',
		
		/**
		 * the securityGuard for this server
		 */
		_securityGuard:null,

		/**
		 * connect off to the rpc registry
		 */
		_registryClient:null,
		
		
		/**
		 * webserver config
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('server.http.reception');

			return ret;
			
		},
		
		/**
		 * setup up the registry client object
		 *
		 */
		getObjectSetupFunctions: function() {
			
			// get the base setup functions
			var ret = this._super();
			
			var server = this;
			
			// load the website registry server
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				server.setupSecurityGuard(callback);
				
			});
			
			// load the website registry server
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				server.setupRegistryClient(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * setup the securityGuard
		 *
		 */
		setupSecurityGuard: function(callback) {
			
			var server = this;
			
			this.message('header', 'Loading Security Guard');
			
			require(['security/guard'], function(securityGuardClass) {
				
				var guard = securityGuardClass.factory();
				
				guard.bind('ready', function() {
					
					server._securityGuard = guard;
				
					callback();
				});
								
			});
			
		},
		
		/**
		 * setup the website registry client
		 *
		 */
		setupRegistryClient: function(callback) {
			
			var server = this;
			
			this.message('header', 'Loading Registry Client');
			
			require(['client/rpc/registry'], function(registryClientClass) {
				
				var client = registryClientClass.factory();
				
				client.bind('ready', function() {
					
					server._registryClient = client;
				
					callback();
				});
								
			});
			
		},
		
		documentRoot: function() {
			return system.resolvePath(this.config('document_root'));
		},
		
		viewRoot: function() {
			return system.resolvePath(this.config('view_root'));
		},
		
		configureApp: function(app) {
			
			var viewRoot = this.viewRoot();
			
			var server = this;
			
			app.configure(function(){
				app.set('views', viewRoot);
				app.set('view engine', 'ejs');
				app.set('view options', {
					layout:'layout.htm'
				});
			});
			
			app.register('.htm', require('ejs'));
			
		},
		
		/*
		 * express reception application
		 */
		 
		addMiddleware: function(app) {
			
			var server = this;
			
			// get the page info from the options
			var pages = server.config('pages') || {};
			
			// make the redis session store
			var RedisStore = connectRedis(express);
			 
			// setup require for the authentication
			app.use(express.bodyParser());
			app.use(express.cookieParser());
			app.use(express.session({ store: new RedisStore, secret: 'gXu3dr5ve'}));
			
			// setup the security guard on the request
  			server._securityGuard.setupApp(app, server.config('auth'));
  			
  			// the front page
  			app.get('/', siteController.index());
  			
  			// static pages
  			app.get(/(about|pricing|faqs)/, siteController.staticpage());
  			
  			// the account homepage JSON data
  			app.get('/account/homepage', accountController.homepageData(this._registryClient));
  			
  			// the account save website JSON method
  			app.post('/account/savewebsite', accountController.saveWebsite(this._registryClient));
  			
  			// the account save database JSON method
  			app.post('/account/savedatabase', accountController.saveDatabase(this._registryClient));
  			
  			// if we get to here we are just after a normal file like JS or CSS
  			app.use(express.static(this.documentRoot()))
  			
  			// not even that was found - time for a 404
  			app.use(siteController.status404());
  			
	  	},
	  	
	  	// add the layout property closure helpers and others
	  	addHelpers: function(app) {
	  		
	  		var server = this;
	  		
	  		app.dynamicHelpers({
				session: function(req, res){
					return req.session || {};
				},
				form: function(req, res){
					return req.body || {};	
				},
				page: layoutPropertyCreator()
				
			});
	  	},
	  	
	  	
	  	
	});
	
});