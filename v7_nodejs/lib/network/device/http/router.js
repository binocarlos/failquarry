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
var eyes = require('eyes');
var util = require('util');
var utils = require('../../../utils');
var Device = require('../../device');
var deck = require('deck');
var httpProxy = require('http-proxy');
var http = require('http');

module.exports = factory;

/*
  Quarry.io - HTTP Proxy
  ----------------------

  Simple HTTP server that emits request routing and expects a URL to proxy it to

 */

function factory(options){

  var routes = {};
  var address = options.address;

  function addroute(hostname, endpoint){
    routes[hostname] || (routes[hostname] = []);
    routes[hostname].push(endpoint);
  }

  function removeroute(hostname, endpoint){
    routes[hostname] = _.filter(routes[hostname] || [], function(route){
      return route.host!=endpoint.host && route.port!=endpoint.port;
    })
  }

  function pickroute(hostname, callback){
    if(!hostname){
      callback('no host');
      return;
    }
    var matchedroutes = routes[hostname];
    if(!matchedroutes){
      /*
      var parts = hostname.split('.');
      async.whilst(
        function(){
          return parts.length>0 && !matchedroutes;
        },
        function(next){
          parts.shift();
          matchedroutes = routes[parts.join('.')];
        },
        function(){
          if(!matchedroutes || matchedroutes.length<=0){
            callback('no route');
            return;
          }
          callback(null, deck.pick(matchedroutes));
        }
      )
      */
      callback('not found');
    }
    else{
      callback(null, deck.pick(matchedroutes));
    } 
  }

  var proxy = new httpProxy.RoutingProxy();

  function route(req, errorfn, routefn){
    pickroute(req.headers.host, function(error, endpoint){
      if(error || !endpoint){
        errorfn();
      }
      else{
        routefn(null, endpoint);
      }
    })
  }

  var router = http.createServer(function (req, res) {
    route(req, function(){
      res.statusCode = 404;
      res.end('no such host');
    }, function(error, endpoint){
      if(error){
        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log('ERROR');
        res.statusCode = 404;
        res.send('not found');
      }
      else{
        proxy.proxyRequest(req, res, endpoint);  
      }
      
    })
  })

  router.on('upgrade', function(req, socket, head) {

    function socketerror(){
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('ROUTE NOT FOUND FOR SOCKET');
    }

    route(req, socketerror, function(error, endpoint){
      if(error){
        socketerror();
      }
      else{
        proxy.proxyWebSocketRequest(req, socket, head, endpoint);
      }
    })
  })

  router.add = addroute;
  router.remove = removeroute;

  router.plugin = function(done){
    router.listen(address.port, function(){
      console.log('-------------------------------------------');
      console.log('Router listening on port: ' + address.port);
      done();
    })
  }

  return router;
}