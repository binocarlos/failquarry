var io = require('../');
var eyes = require('eyes');
var server = io.warehouse();

server.post('/test', function(req, res, next){
	res.send('hello world');
})

var req = io.network.request({
	method:'post',
	url:'/test'
})

var res = io.network.response();

res.on('send', function(){
	console.log('-------------------------------------------');
	console.log('-------------------------------------------');
	eyes.inspect(res.toJSON());
})

server(req, res, function(){
	res.send('not found');
})