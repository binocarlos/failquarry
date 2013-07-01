var _ = require('lodash');
var async = require('async');
var eyes = require('eyes');
var zmq = require('zmq');

module.exports = factory;

/*

  if there is no work then node.js dumps out

  prevent this with a nothing repeat
  
*/
setInterval(function(){
  
}, 60000)

var closing = false;

/*
  Quarry.io - Transport
  ---------------------

  produces different flavours of network connection

  the message content remains a string (the supply chain will turn it
  into a req, res etc)

  the service registry is consulted for addresses

 */

function factory(type){

  var socket = zmq.socket(type);

  /*
  
    make sure the socket goes when we close the process
    
  */
  process.on('SIGINT', function() {

    socket.close();

    if(!closing){
      closing = true;
      setTimeout(function(){
        process.exit();
      }, 100)
    }

  })

  return socket;
}


var reception1 = factory('dealer');
reception1.identity = 'reception1';

var reception2 = factory('dealer');
reception2.identity = 'reception2';

var api1 = factory('router');
api1.identity = 'api1';

api1.on('message', function(){
	eyes.inspect(_.map(_.toArray(arguments), function(arg){
		return arg.toString()
	}))
})

reception1.bindSync('ipc:///tmp/reception1');
reception2.bindSync('ipc:///tmp/reception2');

api1.connect('ipc:///tmp/reception1');
api1.connect('ipc:///tmp/reception2');

reception1.send('hello 1');
reception2.send('hello 2');

api1._zmq.disconnect('ipc:///tmp/reception2');





