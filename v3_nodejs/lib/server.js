/*!
 * JQuarry express mount
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var socketio = require('socket.io'),
		express = require('express'),
		connectUtils = require('express/node_modules/connect/lib/utils'),
		cookie = require('cookie'),
		http = require('http'),
		path = require('path'),
		async = require('async'),
		requestFactory = require('./server/request'),
		responseFactory = require('./server/response'),
		EventEmitter = require('eventemitter2').EventEmitter2,
		_ = require('underscore');

// the socket io listening on the passed in server
var buildSockets = function(server){

	var io = socketio.listen(server);

	io.configure(function(){
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.set('log level', 1);                    // reduce logging
    io.set('transports', [                     // enable all transports (optional if you want flashsocket)
        'websocket'
      //, 'flashsocket'
      //, 'htmlfile'
      , 'xhr-polling'
      , 'jsonp-polling'
    ]);
  });

  return io;
}

// the mounted express app
var buildExpress = function(){
	var app = express();

  app.configure(function(){
    
    app.set('views', path.join(__dirname, 'server', 'views'));
    app.set('view engine', 'ejs');
    
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'server', 'www')));


  })

  return app;

}

var QuarryServer = {

	init: function(){

		_.extend(this, EventEmitter.prototype);

	}
}

// in: express application
// out: jquarry express middleware mapper
function serverFactory(config){

	config = config ? config : {};

	var server = config.server;
	var mainExpress = config.express;
	var sessionStore = config.sessionStore;
	var cookieSecret = config.cookieSecret;

	var quarryServer = Object.create(QuarryServer);

	quarryServer.init();

	console.log('here');
	
	var middleware = {};

	var io = buildSockets(server);
	var subExpress = buildExpress();

	var middleware = {};

	quarryServer.io = function(){
		return io;
	}

	quarryServer.express = function(){
		return subExpress;
	}

	quarryServer.use = function(route, middlewareFunction){
		var arr = middleware[route] ? middleware[route] : middleware[route] = [];

		arr.push(middlewareFunction);

		return this;
	}

	var pipeMiddleware = function(route, req, callback){
		var res = responseFactory(req);

		async.forEachSeries(middleware[route], function(middlewareFunction, next){
			middlewareFunction.apply(quarryServer, [req, res, next]);
		}, function(error){
			console.log('FINISHED RUNNING MIDDLEWARE');
			callback(error, res);
		})
	}

	// map in the sub express-app beneath jquarry
	
	mainExpress.get("/jquarry*", subExpress);
	mainExpress.get("/jquarry", subExpress);

	subExpress.get(/\/jquarry\/(api|header)\.js/, function(req, res){
		res.type('application/javascript');
		res.render(req.params[0], {

		})
	})

	// the auth handshake - this relies on the session store
	io.set('authorization', function (data, accept) {
  	if (!data.headers.cookie) 
    	return accept('No cookie transmitted.', false);

    data.cookie = cookie.parse(data.headers.cookie);

    if (cookieSecret) {
      data.cookie = connectUtils.parseSignedCookies(data.cookie, cookieSecret);
    }
    
  	data.sessionID = data.cookie['connect.sid'];

	  sessionStore.load(data.sessionID, function (err, session) {
	    if (err || !session) return accept('Error', false);

	    data.session = session;
	    return accept(null, true);
	  });
	}).sockets.on('connection', function (socket) {

	  var session = socket.handshake.session;
	  
	  socket.on('rpc:request', function(req){

	  	var req = requestFactory(req);
	  	req.session = session;
	  	pipeMiddleware(req.route, req, function(error, res){
	  		socket.emit('rpc:response', res);
	  	})
	  })

	  /*
	  socket.on('set value', function (val) {
	    sess.reload(function () {
	      sess.value = val;
	      sess.touch().save();
	    });
	  });
		*/
	});

	return quarryServer;
}

// expose createModule() as the module
exports = module.exports = serverFactory;