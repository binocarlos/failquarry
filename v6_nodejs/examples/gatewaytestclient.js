var io = require('../');
var eyes = require('eyes');
var fs = require('fs');
var ZMQPubSub = require('../lib/network/zeromq/client/pubsub');
var Socket = require('../lib/network/zeromq/socket');
var zmq = require('zeromq-port');

var client = zmq.socket('pub');//new Socket('gatewaypub', 'pub', 7890);

client.connect('tcp://127.0.0.1:7890');

client.send('test apples');

console.log('-------------------------------------------');
console.log('connected');