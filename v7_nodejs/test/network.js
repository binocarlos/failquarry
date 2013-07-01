/*

   this stops our custom logger wrapper
  
*/
process.env.TEST_MODE = true;
process.env.NODE_ENV = 'test';

var io = require('../');
var Device = require('../lib/network/device');
var Endpoints = require('../lib/network/tools/endpointfactory');
var eyes = require('eyes');
var data = require('./fixtures/data');
var async = require('async');



describe('switchboard', function(){

  var normallog = console.log;

  beforeEach(function(done){
    
    done();
  })

  afterEach(function(done){
    
    done();
  })

  it('should proxy basic event', function(finished) {
    console.log = function(){}
    this.timeout(500);
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
      }
    ], function(next){
      client.listen('hello', function(message){
        message.should.equal('world');
        finished();
      })
      client.broadcast('hello', 'world');
      console.log = normallog;
    })        

  })
  
})
