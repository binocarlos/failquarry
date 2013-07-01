/*

  (The MIT License)

  Copyright (C) 2005-2013 Kai Davenport

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/**
 * Module dependencies.
 */


var utils = require('../utils')
  , eyes = require('eyes')
  , async = require('async')
  , _ = require('lodash');

var EventEmitter = require('events').EventEmitter;

var Device = require('./device');
var Warehouse = require('../warehouse');
var Container = require('../container');
var EndpointFactory = require('./tools/endpointfactory');
var DNS = require('./tools/dns');
var Heartbeat = require('./tools/heartbeat');

/*

  Quarry.io - Job
  ---------------

  The thing is is booted whereever and always has a pure JSON config

  The different flavours of job determine how this behaves

  They all have the option to hook into the HQ switchboard which is effectively
  the system DNS

  Reception clients listen for what reception servers there are and switchboard clients
  the same

  Websites broadcast their domains in the same way - the front router picks these up

  Config:

    id - the stack id for this job
    stackid - the stack running this job
    department - what flavour the job is
    rawjob - the JSON dump of the job configuration (will contain tasks)
    hq - the endpoints of the HQ DNS switchboard

  
*/

module.exports = function(config){

  /*
  
    representing the server we are running on

    also contains the Mongo and Redis endpoints
    
  */
  var location = Container.new(config.location);

  /*
  
    the config for the whole stack
    
  */
  var hq = Container.new(config.hq);

  /*
  
    the container for the job we are running
    
  */
  var container = Container.new(config.job);

  /*
  
    the endpoint factory if we need to create some
    
  */
  var endpoints = EndpointFactory(hq.attr('flavour'), hq.attr('systemfolders.run'));

  /*
  
    what flavour is the stack running in
    
  */
  var flavour = hq.attr('flavour');

  /*
  
    the type of job is it
    
  */
  var department = container.attr('department');

  /*
  
    get a DNS setup for we can register and listen for departments
    
  */
  function dnsfactory(){
    return DNS({
      endpoints:hq.attr('endpoints')
    })
  }

  /*
  
    the actual job object that each department will augment with behaviour
    
  */
  var job = {
    id:container.quarryid(),
    stackid:hq.quarryid(),
    container:container,
    location:location,
    hq:hq
  }
  
  _.extend(job, EventEmitter.prototype);

  job.run = function(done){
    async.series([
      function(next){
        job.prepare(next);
      }
    ], done);
  }

  job.prepare = function(done){
    done && done();
  }

  job.getaddress = function(type, name){
    return endpoints[type].apply(null, [location.attr('host'), name])
  }

  job.register_dns = function(datafn){
    var dns = dnsfactory();
    dns.register(department, datafn);
    dns.plugin(function(){
      console.log('-------------------------------------------');
      console.log('DNS Registered: ' + department);
    })
  }

  job.listen_dns = function(department, addfn, removefn){
    var dns = dnsfactory();
    dns.listen(department);
    dns.on('add', addfn);
    dns.on('remove', removefn);
    dns.plugin(function(){
      console.log('-------------------------------------------');
      console.log('DNS listening: ' + department);
    })
  }

  job.get_switchboard_mesh = function(callback){
    if(job._switchboard_mesh){
      return job._switchboard_mesh;
    }
    job._switchboard_mesh = Device('switchboard.meshclient', {
      name:department + ' Worker switchboard client: ' + job.id,
      stackid:job.stackid,
      dns:{
        register:job.register_dns,
        listen:job.listen_dns
      }
    })

    return job._switchboard_mesh;
  }

  job.get_reception_back = function(callback){
    var receptionback = Device('reception.backclient', {
      name:department + ' Worker reception back',
      department:department,
      switchboard:job.get_switchboard_mesh(),
      dns:{
        register:job.register_dns,
        listen:job.listen_dns
      }
    })

    receptionback.plugin(function(){
      callback(null, receptionback);
    })
  }

  job.get_reception_front = function(callback){
    var supplychain = Device('reception.frontclient', {
      name:job.department + ' Worker reception front',
      department:department,
      stackid:job.stackid,
      switchboard:job.get_switchboard_mesh(),
      dns:{
        register:job.register_dns,
        listen:job.listen_dns
      }
    })

    supplychain.plugin(function(){
      callback(null, supplychain);
    })
  }

  job.get_servers = function(){
    return location.attr('servers');  
  }
  
  job.get_cache_options = function(){
    return location.attr('servers.redis');
  }

  job.get_cache = function(){
    var cacheoptions = location.attr('servers.redis');
    var cache = Device('cache.factory', cacheoptions);
    return cache;
  }

  var module = require('./workers/' + container.attr('department'));

  module(job);

  return job;
}