var io = require('../');
var eyes = require('eyes');
var fs = require('fs');
var ZMQPubSub = require('../lib/network/zeromq/server/pubsub');
var Socket = require('../lib/network/zeromq/socket');
var zmq = require('zeromq-port');

var server = zmq.socket('sub');//new Socket('gatewaysub', 'sub', 7890);

server.subscribe('');

server.bindSync('tcp://127.0.0.1:7890');

server.on('message', function(){
	console.log('-------------------------------------------');
	console.log('server message');
})

console.log('-------------------------------------------');
console.log('listening');