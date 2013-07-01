/*

   this stops our custom logger wrapper
  
*/

var io = require('../');
var Device = require('../lib/network/device');
var Endpoints = require('../lib/network/tools/endpointfactory');
var eyes = require('eyes');
var async = require('async');


    var endpointfactory = Endpoints('development', '/tmp', '127.0.0.1');
    var endpoints = {
      pub:endpointfactory.quarry(),
      sub:endpointfactory.quarry()
    }

    var server = Device('switchboard.server', {
      name:'Test Switchboard Server',
      stackid:'test',
      pub:{
        type:'pub',
        direction:'bind',
        address:endpoints.pub
      },
      sub:{
        type:'sub',
        direction:'bind',
        address:endpoints.sub
      }
    })

    var client = Device('switchboard.standardclient', {
      name:'Test Switchboard Client',
      stackid:'test',
      endpoints:endpoints
    })

    async.series([

      function(next){
        server.plugin(next);
      },

      function(next){
        client.plugin(function(){
          setTimeout(next, 100);
        })
      },

      function(next){
        console.log('-------------------------------------------');
        console.log('listen');
        client.listen('hello', function(message){
          eyes.inspect(message);
        })
        next();
      },

      function(next){
        setInterval(function(){
          client.broadcast('hello', 'world');  
        }, 100)
        
      }

    ], function(){
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('here');
    })
