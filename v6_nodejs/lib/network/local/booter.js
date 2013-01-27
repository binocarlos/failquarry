#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var async = require('async');
var eyes = require('eyes');
var utils = require('../../server/utils');
var fs = require('fs');
var _ = require('underscore');
var Deployment = require('../deployment');
var Client = require('./client');
var RPC = require('./server/rpc');
var Gateway = require('../gateway');
var Webserver = require('../../webserver/proto');

program
  .option('-d, --deployment <filepath>', 'the location of the JSON file for the deployment we are booting', './root.json')

program
  .command('start')
  .description('start a local network service')
  .action(function(env){

    if(!fs.existsSync(program.deployment)){
      utils.logerror(program.deployment + ' deployment file not found');
      process.exit(); 
    }

    var deployment_data = require(program.deployment);

    var server = new RPC(new Deployment(deployment_data));

    server.bind(function(){
      console.log('-------------------------------------------');
      console.log('server listening');
    })
  })

program
  .command('webserver')
  .description('start a local network webserver')
  .action(function(env){

    if(!fs.existsSync(program.deployment)){
      utils.logerror(program.deployment + ' deployment file not found');
      process.exit(); 
    }

    /*
    
      this is the gateway config that contains
      the network config for each stack on the network (inside .clients)
      
    */
    var config = require(program.deployment);

    var server = new Webserver(config);
      
    server.bind(function(){
      console.log('-------------------------------------------');
      console.log('webserver listening');
    })
  })  

program
  .command('gateway')
  .description('start a local network gateway')
  .action(function(env){

    if(!fs.existsSync(program.deployment)){
      utils.logerror(program.deployment + ' deployment file not found');
      process.exit(); 
    }

    /*
    
      this is the gateway config that contains
      the network config for each stack on the network (inside .clients)
      
    */
    var deployment = require(program.deployment);

    deployment.client_provider = function(hostname, callback){
      var client_data = deployment.clients[hostname];
      var client = new Client(client_data);
      callback(null, client);
    }
    
    var gateway = new Gateway(deployment);

    gateway.bind(function(){
      console.log('-------------------------------------------');
      console.log('gateway listening');
    })
  })

program
  .command('*')
  .action(function(command){
    console.log('command: "%s" not found', command);
  })

program.parse(process.argv);