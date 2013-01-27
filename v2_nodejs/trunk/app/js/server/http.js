/*
 * @class 		server.http
 * @extends 	server
 * @filename   	server/http.js
 * @package    	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry HTTP server - uses connect and middleware
 *
 */

define([

	// the base class
	'./server',
	
	'system',
	
	// express
	'express',
	
	// custom middleware
	'./http/middleware/quip',
	
	// dev
	'dev'
	
], function(

	// the base class
	server,
	
	systemClass,
	
	// express
	express,
	
	// setup nice functions on the result
	quip
	
) {
	
	var system = systemClass.instance();
	
	return server.extend(
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
	
		/**
		 * http server config
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('server.http');

			return ret;
			
		},
			
		buildServer: function() {
			
  			var app = express.createServer();
  			
  			this.configureApp(app);
  			
  			// tell us how blazingly fast this will be
			app.use(express.responseTime());
			
			// use the favicon from the config
			app.use(express.favicon(system.resolvePath(this.config('favicon'))));
			
			// allow english HTTP methods like 'ok'
			app.use(quip());
			
			// it is up to the server what it want to actuall do by what middleware it puts here
			// by default all you get is responseTime and 404
			this.addMiddleware(app);
			
			// this is called last assuming the middleware did not deal with the request
			// along it's chaing
			app.use(this.handle404());
			
			// what view helpers does the server want
			this.addHelpers(app);
			
			
  			return app;
		},
		
		configureApp: function(app) {
			
		},
		
	  	addMiddleWare: function(app) {
	  		
	  	},
	  	
	  	addHelpers: function(app) {
	
	  	},
	  	
	  	// this is the last in the chain - it will handle anything not handled already
	  	handle404: function() {
	  	
	  		return function(req, res, next) {
	  			
	  			res.notFound("page cannot be found");
	  			
	  		}
	  		
	  	},
	  	
		// this is the last in the chain - it will handle anything not handled already
	  	do404: function(req, res, next) {
	  	
	  		var handler = this.handle404();
	  		
	  		handler(req, res, next);
	  		
	  	}
		
	});
	
});