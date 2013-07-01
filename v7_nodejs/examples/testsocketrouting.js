var eyes = require('eyes');
var async = require('async');
var utils = require('../lib/utils');
var express = require('express');
var engines = require('consolidate');
var socketio = require('socket.io');
var http = require('http');
var RedisStore = require('../lib/webserver/tools/redisstore')(express);
var httpProxy = require('http-proxy');
var app = express();
var server = http.createServer(app);

app.use(express.query());
app.use(express.responseTime());

/*

  POST
  
*/
app.use(express.bodyParser());

app.engine('ejs', engines.ejs);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

var cookieSecret = 'rodneybatman';
var cookieParser = express.cookieParser(cookieSecret);
var sessionStore = new RedisStore({
	host:'127.0.0.1',
	port:6379
})

/*

  Session
  
*/


app.use(cookieParser);
app.use(express.session({
  store:sessionStore,
  secret:cookieSecret
}))

var io = socketio.listen(server);

if(process.env.NODE_ENV=='production'){
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');
}

io.set('log level', 1);
io.set('transports', [
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
])

app.use(app.router);

app.get('/', function(req, res, next){
	res.render('test');
})

io.sockets.on('connection', function(socket){

	socket.on('test', function(val){
		eyes.inspect('ok: ' + val);
	})
})

server.listen(8080, function(){
	console.log('web on port 8080');
})

var proxy = new httpProxy.RoutingProxy();

var router = http.createServer(function(req, res){
  //
  // Proxy normal HTTP requests
  //
  proxy.proxyRequest(req, res, {
    host: 'localhost',
    port: 8080
  })
})

router.on('upgrade', function(req, socket, head) {
  //
  // Proxy websocket requests too
  //
  proxy.proxyWebSocketRequest(req, socket, head, {
    host: 'localhost',
    port: 8080
  })
});

router.listen(80, function(){
	console.log('router on port 80');
})

