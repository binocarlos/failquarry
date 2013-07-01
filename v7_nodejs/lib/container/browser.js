/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

var _ = require('lodash');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var Router = require('./router');

/*

  quarry.io - browser

  exports the core container api for the browser (so it is messy and hence seperate)


 */

module.exports = function(Proto){

  var factory = Proto.factory;

  return function(containerconfig){

    /*

      connect up the socket
      
    */
    var socket = io.connect([containerconfig.protocol, containerconfig.hostname, '/', containerconfig.socketid].join(''));

    var subscriptions = {};

    socket.on('connect', function(){
      announceready();
    })

    socket.on('broadcast', function(routingkey, message){
      console.log('-------------------------------------------');
      console.log('SOCKET broadcast!!!');

      var fns = subscriptions[routingkey];

      _.each(fns, function(fn){
        fn(message);
      })    
    })

    var switchboard = {
      listen:function(routing_key, fn){

        if(!fn){
          fn = routing_key;
          routing_key = '*';
        }

        console.dir('portal listen : ' + routing_key);

        if(!subscriptions[routing_key]){
          subscriptions[routing_key] = [];
          socket.emit('subscription', routing_key);
        }

        subscriptions[routing_key].push(fn);

        return this;
      },
      cancel:function(routing_key, fn){

        console.dir('portal cancel : ' + routing_key);

        if(fn){
          subscriptions[routing_key] = _.filter(subscriptions[routing_key], function(fn){
            return fn!==fn;
          })

          if(_.keys(subscriptions[routing_key]).length<=0){
            delete(subscriptions[routing_key]);
            socket.emit('cancelsubscription', routing_key);
          }
        }
        else{
          delete(subscriptions[routing_key]);
          socket.emit('cancelsubscription', routing_key);
        }
        return this;
      },
      broadcast:function(routing_key, packet){

        console.dir('portal broadcast : ' + routing_key);

        socket.emit('broadcast', {
          routing_key:routing_key,
          packet:packet
        })

        return this;
      }
    }

    _.extend(switchboard, EventEmitter.prototype);

    var readycallbacks = [];
    var isready = false;

    function announceready(){

      isready = true;
      async.forEach(readycallbacks, function(callback, next){
        callback();
        next();
      }, function(){

      })

      readycallbacks = [];
    }

    function supplychain(req, res, next){

      if(!isready){
        readycallbacks.push(function(){
          supplychain(req, res, next);
        })
        return;
      }

      socket.emit('request', req.routingpacket(), req.toJSON(), function(response){
        res.update(response);
        res.send();
      })

    }

    supplychain.switchboard = switchboard;

    /*

      this is the browser warehouse supply chain setup
      
    */

    function getcontainer(connectpath){

      return Proto.connect(supplychain, connectpath);

    }

    function getuser(data){
      var retcontainer = Proto.factory([data]);      
      retcontainer.supplychain = supplychain;
      return retcontainer;
    }

    var container = getcontainer();
    container.user = containerconfig.user ? getuser(containerconfig.user) : factory([]);
    return container;
  }
}