/*
  Copyright (c) 2012 All contributors as noted in the AUTHORS file

  This file is part of quarry.io

  quarry.io is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  quarry.io is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
  Module dependencies.
*/

var _ = require('underscore');
var async = require('async');
var eyes = require('eyes');
var Instance = require('../instance');
var Bootloader = require('../bootloader');
var Node = require('../../stack/node');
var Client = require('./client');
var Base = require('../proto');
var fs = require('fs');
var wrench = require('wrench');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

/*
  Quarry.io - Development Deployment
  ----------------------------------

  All nodes run in the same process on a functional routed instance


 */

/*

  We only ever have one instance in a development stack



 */

var LocalNetwork = module.exports = Base.extend({

  initialize:function(){
    Base.prototype.initialize.apply(this, []);

    /*
    
      keep track of the processes we will run inside of mongroup
      
    */
    this.mongroup = [];
  },

  build_folder:function(){
    return __dirname + '/../../../builds/' + (this.get('folder').split('/').pop());
  },

  ensure_folders:function(callback){

    wrench.mkdirSyncRecursive(this.get('folder'), 0777);

    var build_folder = this.build_folder();

    wrench.mkdirSyncRecursive(build_folder, 0777);
    wrench.mkdirSyncRecursive(build_folder + '/pids', 0777);
    wrench.mkdirSyncRecursive(build_folder+'/logs', 0777);


    //wrench.mkdirSyncRecursive(this.get('folder')+'/stacks', 0777);

    //wrench.mkdirSyncRecursive(this.get('folder')+'/resources', 0777);
    //wrench.mkdirSyncRecursive(this.get('folder')+'/resources/files', 0777);

    callback && callback();
  },

  isrunning:function(){
    return fs.existsSync(this.build_folder());
  },

  /*
  
    create the folder that the build for a stack will live in
    
  */
  ensure_stack_folder:function(stack_id){
    if(fs.existsSync(this.build_folder() + '/' + stack_id)){
      return;
    }

    wrench.mkdirSyncRecursive(this.build_folder() + '/' + stack_id, 0777);
    
    wrench.mkdirSyncRecursive(this.build_folder() + '/' + stack_id + '/deployments', 0777);
  },

  is_running:function(){
    return fs.existsSync(this.pid_file());
  },

  pid_file:function(){
    return this.build_folder()+'/network.pid';
  },

  load:function(callback){
    var self = this;
    if(this.is_running()){
      self.emit('error', 'Network is already running', true);
      return;
    }
    Base.prototype.load.apply(this, [callback]);
  },

  // there is one single instance for a dev network
  load_instances:function(loaded){
    this.add_instance(new Instance({
      id:'local',
      hostname:'127.0.0.1'
    }))

    loaded();
  },

  // pile all the nodes onto the single instance
  allocate:function(loaded){
    var self = this;
    var development_instance = this.get_instance('local');

    self.allocate_gateway(development_instance);
    
    _.each(self.stacks, function(stack){

      self.allocate_webserver(stack, development_instance);

      self.emit('message', {
        text:'Allocate Stack: ' + stack.id,
        color:'red',
        depth:3
      })
      stack.recurse(function(node){
        self.allocate_node(stack, node, development_instance);
      })
    })

    loaded();
  },

  // boot the code inline
  deploy_rpc:function(deployment, loaded){

    var self = this;

    /*
  
      outputs the JSON for a deployment into the network/deployment folder
      
    */
    deployment.save();

    this.mongroup.push({
      type:'rpc',
      name:deployment.processname(),
      deployment:deployment.savepath()
    })

    self.rpc_message(deployment);

    loaded();
    
  },

  // boot the code inline
  deploy_webserver:function(stack_id, loaded){

    var self = this;

    var allocation = this.webservers[stack_id];
    var stack = self.stacks[stack_id];
    var websites = stack.websites;

    var webserver_config = {
      ports:allocation.ports,
      websites:websites,
      client:self.get_client_config(stack_id)
    }

    fs.writeFileSync(this.build_folder() + '/' + stack_id + '/webserver.json', JSON.stringify(webserver_config, null, 4), 'utf8');

    loaded && loaded();
    
  },  

   // boot the code inline
  deploy_gateway:function(loaded){

    var self = this;

    var gateway_config = {
      ports:this.get('ports'),
      website_routing_table:this.website_routing_table(),
      clients:{}
    }

    _.each(_.keys(this.allocations), function(stack_id){
      gateway_config.clients[stack_id] = self.get_client_config(stack_id);
    })

    fs.writeFileSync(this.build_folder() + '/gateway.json', JSON.stringify(gateway_config, null, 4), 'utf8');

    loaded && loaded();
    
  },


  mongroup_file:function(){
    return this.build_folder() + '/mongroup.conf';
  },

  post_booted:function(callback){
    var self = this;
    var booter = __dirname + '/booter.js';

    /*
    
      first setup the mongroup file
      
    */
    var deployment_lines = _.map(this.mongroup, function(process){
      return process.name + ' = node ' + booter + ' start --deployment=' + process.deployment;
    })

    /*
    
      generic mongroup
      
    */
    var monlines = ([
      'pids = ' + this.build_folder() + '/pids',
      'logs = ' + this.build_folder() + '/logs',
      'on-error = ' + __dirname + '/logger.js error',
      'on-restart = ' + __dirname + '/logger.js restart'
    ])
    /*
    
      the individual RPC deployments
      
    */
    .concat(deployment_lines)
    /*
    
      webservers
      
    */
    .concat(_.map(_.keys(this.stacks), function(stack_id){
      return (stack_id.replace(/\./g, '_') + '_webserver') + ' = node ' + booter + ' webserver --deployment=' + (self.build_folder() + '/' + stack_id + '/webserver.json');
    }))
    /*
    
      gateway
      
    */
    .concat([
      'gateway = node ' + booter + ' gateway --deployment=' + (this.build_folder() + '/gateway.json'),
      ''
    ])

    var mongrouptext = monlines.join("\n");

    fs.writeFileSync(this.mongroup_file(), mongrouptext, 'utf8');

    /*
    
      now lets kick off the mongroup and log
      
    */

    exec('mongroup --config ' + this.mongroup_file() + ' start',
      function (error, stdout, stderr) {
        if(!error){
          console.log('-------------------------------------------');
          console.log('-------------------------------------------');
          console.log('network started');
          console.log(stdout);  
        }
        
        callback && callback(error, stdout);
    })
    
  },

  stop:function(callback){
    var self = this;
    exec('mongroup --config ' + this.mongroup_file() + ' stop',
      function (error, stdout, stderr) {
        wrench.rmdirSyncRecursive(self.build_folder(), true);
        callback && callback(error, stdout);
    })
  },

  status:function(callback){

    exec('mongroup --config ' + this.mongroup_file() + ' status',
      function (error, stdout, stderr) {
        console.log('-------------------------------------------');
        console.log('network status');
        console.log('-------------------------------------------');
        console.log(stdout);

        callback && callback(error, stdout);
    })
  },

  debug:function(callback){
    // Child will use parent's stdios
    spawn('mongroup', [
      '--config',
      this.mongroup_file(),
      'logf'
    ], { stdio: 'inherit' })
  },

  client_factory:function(data){
    return new Client(data);
  }
})