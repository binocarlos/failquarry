/*
 * @class 		server.http.webserver
 * @extends		server.http
 * @filename   	server/http/webserver.js
 * @package    	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry Webserver - a HTTP server that serves customers web-sites
 *
 * it routes based on the domain name - this is updated via redis from the admin panel
 *
 *
 *
 */

define([

	'../http',
	
	'./middleware/websitestatic',
	
	'async',
	
	'system',
	
	'underscore',
	
	'component',
	
	'component/server/request',
	
	'express',
	
	'quarry'
	
], function(

	http,
	
	websitestatic,
	
	async,
	
	systemClass,
	
	_,
	
	componentClass,
	
	websiteRequest,
	
	express,
	
	$quarry
	
	
	
	
) {
	
	// get a reference to the server system
	var system = systemClass.instance();
	
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
		name:'Web Server',
		
		// the website registry RPC client
		_registryClient: null,
		
		/*
		 * the thread pool
		 */ 
		_pool:null,
		
		// keep a cache of the routing decisions made
		_routingCache:null,
		
		/**
		 * webserver config
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('server.http.webserver');

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
				server.setupRegistryClient(callback);
				
			});
			
			// load the thread pool
			ret.push(function(callback) {
				
				server.setupThreadPool(callback);
				
			});
			
			// load the website registry server
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				server.setupRoutingCache(callback);
				
			});
			
			return ret;
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
		
		/**
		 * setup the thread pool
		 *
		 */
		setupThreadPool: function(finishedCallback) {
			
			var server = this;
			
			this.message('header', 'Loading Thread Pool');
			
			require(['quarryscript/pool'], function(poolClass) {
				
				var pool = poolClass.factory();
				
				pool.bind('ready', function() {
					
					server._pool = pool;
					
					finishedCallback();
					
				});
				
			});

		},
		
		pool: function() {
			return this._pool;
		},
		
		/**
		 * setup the website routing cache
		 *
		 */
		setupRoutingCache: function(callback) {
			
			/*
			var server = this;
			
			this.message('header', 'Loading Website Routing Cache');
			
			require(['cache/websiterouter'], function(cacheClass) {
				
				var cache = cacheClass.factory();
				
				cache.bind('ready', function() {
					
					server._routingCache = cache;
				
					callback();
				});
								
			});
			*/
			
			callback();
			
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
					layout:false
				});
			});
			
			app.register('.htm', require('ejs'));
			
		},
		
		/*
		 * add the websiteLoader to grab the website from the hostname
		 * add the fileServer to serve up the file from that website
		 */
		addMiddleware: function(app) {
			
			var webserver = this;
			
			// connect to the registry and ask whether we have a file to serve for a website
			app.use(this.websiteRouter());
			
			// make the decision routing middleware
			webserver._decisionserver = this.serveRoutingDecisionFactory();
			
			// make the script processor middleware
			webserver._quarryprocesser = this.processQuarryFileFactory();
			
			// provide the static file server for when needed
			webserver._staticserver = websitestatic();
			
  			return app;
	  		
	  	},
	  
		/*
	  	 * routes the path info to the website to ask for a filepath then sends that off to the static middleware
	  	 */
	  	websiteRouter: function() {
	  		
	  		var webserver = this;
	  		var registry = this._registryClient;
	  		
			var shouldCache = system.production();
	  		var routingCache = {};
	  		
	  		var foundRoutingDecision = function(req, res, next, decision) {
	  			
		  		// this means that no website was found - we do a general redirect in this case
			  	if(!decision.website_id) {
			  					
			  		webserver.serveNoWebsite(req, res, next);
			  					
			  	} else {
			  					
			  		webserver._decisionserver(req, res, next, decision);
	
			  	}
			  				
		  	};
		  		
	  		return function(req, res, next) {
	  		
	  			var parsedRequest = websiteRequest(req);
	  			
	  			// setup of path on the request for further middleware
	  			req.quarryPath = parsedRequest.pathname;
	  			
	  			var reqId = parsedRequest.host + parsedRequest.href;
	  			
	  			var cachedDecision = shouldCache ? routingCache[reqId] : null;
	  			
	  			if(cachedDecision) {
	  				foundRoutingDecision(req, res, next, cachedDecision);
	  				return;
	  			}
	  			
	  			
	  			// generate a new query to pass off to the server
	  			registry.runQuery('component/routingdecision', {
	  				
	  				request:parsedRequest
	  				
	  			}, function(error, decision) {
	  	
	  				if(shouldCache) {
	  					routingCache[reqId] = decision;
	  				}
	  					
	  				foundRoutingDecision(req, res, next, decision);
	  					
	  			});
	  		};
	  	},
	  	
	  	/*
	  	 * no website has been found - lets decide what to do
	  	 */
	  	serveNoWebsite: function(req, res, next) {
	  		
	  		res.ok('There was no website found: ' + req.headers.host);
	  		
	  	},
	  	
	  	/*
	  	 * take a routingDecision and serve it
	  	 */
	  	serveRoutingDecisionFactory: function() {
	  	
	  		var webserver = this;
	  		
	  		return  function(req, res, next, decision) {
	  		
		  		// if we have a file decision - serve it
		  		if(decision.file) {
		  			// line up the static file on the request
		  			req.quarryFile = decision.file;
		  			
			  		// so we need to process the stream for quarry script - lets listen
		  			if(decision.parse_quarry_mode) {
		  				// we are processing this file
		  				webserver._quarryprocesser(req, res, next, decision);
			  		}
			  		else {
			  			// we are just serving this file
		  				webserver._staticserver(req, res, next);
		  			}
		  		}
		  		// at this point we don't know what to do with the decision - 404
		  		else {
		  			webserver.do404(req, res, next);
		  		}
		  	};
	  	},
	  	
	  	loadComponent: function(loadedCallback) {
			
			var query = this;
			
			// load the component from the frozen component in the decision
			componentClass.factory(query._decision.component(), function(error, websiteComponent) {

				loadedCallback(null, websiteComponent);
					
			});
			
		},
		
	  	processQuarryFileFactory:  function() {
	  	
	  		var webserver = this;
	  		
	  		var shouldCache = system.production();
	  		var registry = this._registryClient;
	  		
	  		var profileCache = {};
	  		var fileCache = {};
	  		
	  		return function(req, res, next, decision) {
	  		
		  		var filePath = decision.file;
				
				async.series({
				
					profile:function(nextSeries) {
						
						var website_id = decision.website_id;
						
						var cachedProfile = shouldCache ? profileCache[website_id] : null;
	  			
	  					if(cachedProfile) {
	  						nextSeries(null, cachedProfile);
	  						return;
	  					}
						
						// generate a new query to pass off to the server
			  			registry.runQuery('component/websiteprofile', {
			  				
			  				id:website_id
			  				
			  			}, function(error, profile) {
			  	
			  				if(shouldCache) {
			  					profileCache[website_id] = profile;
			  				}
			  				
			  				nextSeries(null, profile);	
			  			});
						
					},
					
					// we must first load the contents of the file
					fileContents:function(nextSeries) {
						
						if(shouldCache && fileCache[filePath]) {
							nextSeries(null, fileCache[filePath]);
							return;
						}
						
						system.readFile(filePath, function(error, content) {
							if(error || !content) {
								webserver.do404(req, res, next);
								return;
							}
							
							if(shouldCache) {
								fileCache[filePath] = content;
							}
							
							console.log(content);
							nextSeries(error, content);	
						});
					}
					
				}, function(error, props) {
					
					var source = props.fileContents;
					var profile = props.profile;
					
					// now lets do the dirty
					var documentId = webserver._pool.processDocument({
						source:source,
						decision:decision,
						profile:profile
					}, function(error, result) {
						
						error ? res.error(error) : res.ok(result);
						
					});
					
				});
			};
			
		}
	
	});
	
});