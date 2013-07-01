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
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var wrench = require('wrench');
var eyes = require('eyes');
var _ = require('lodash');
var async = require('async');
var extend = require('xtend');
var fs = require('fs');
var Container = require('../container');
var EndpointFactory = require('./tools/endpointfactory');
var Slurper = require('./tools/stackslurper');
var defaultconfig = require('./tools/config');

var Device = require('./device');
var TestBooter = require('./tools/testbooter');
var LocalBooter = require('./tools/localbooter');

/*

  quarry.io - system proto

  the core quasi-stack used by the rest of the stacks like a mothership of greatness if you like
  
*/

module.exports = HQ;

function HQ(options){
  EventEmitter.call(this);
  this.initialize(options);
}

util.inherits(HQ, EventEmitter);

/*

  create container data representing the stack layout (api and websites)
  
*/
HQ.prototype.initialize = function(options, callback){
  
  this.options = options;

  /*
  
    setup the system folders
    
  */
  var folders = {};
  _.each(defaultconfig.systemfolders, function(folder){
    var full = defaultconfig.systemhome + '/' + folder;
    folders[folder] = full;
    //wrench.rmdirSyncRecursive(full, true);
    wrench.mkdirSyncRecursive(full);
  })
  defaultconfig.systemfolders = folders;

  this.endpointfactory = EndpointFactory(this.options.flavour, folders.run);

  this.systemconfig = this.makeconfig({
    endpoints:{
      rpc:this.endpointfactory.quarry(),
      pub:this.endpointfactory.quarry(),
      sub:this.endpointfactory.quarry()  
    }
  })


  return this;
}

HQ.prototype.makeconfig = function(extra){
  return Container.new('hq', _.extend.apply(_, [
    defaultconfig,
    defaultconfig.flavours[this.options.flavour],
    this.options,
    extra
  ]));
}

HQ.prototype.buildstack = function(folder, done){
  var self = this;

  if(!fs.existsSync(folder)){
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log(folder + ' does not exist');
    process.exit();
  }

  Slurper(folder, this.systemconfig, function(error, stacks){
    
    if(error){
      ready(error);
      return;
    }

    var stack = stacks[0];

    done(null, stack);
  })
}

HQ.prototype.run = function(buildid, ready){

  var self = this;
  var runner = {};

  var buildfolder = this.systemconfig.attr('systemfolders.builds') + '/' + buildid;

  async.series([

    function(next){
      var hqdata = require(buildfolder + '/config/system.json');
      var stackdata = require(buildfolder + '/config/stack.json');

      runner.hq = Container.new(hqdata);
      runner.stack = Container.new(stackdata);

      next();
    },

    function(next){
      
      runner.server = Device('hq.server', {
        container:runner.hq,
        endpoints:{
          rpc:runner.hq.attr('endpoints.rpc'),
          pub:runner.hq.attr('endpoints.pub'),
          sub:runner.hq.attr('endpoints.sub')
        }
      })

      runner.server.plugin(function(){
        setTimeout(next, 1000);
      });
      
    },

    function(next){
      
      runner.client = Device('hq.client', {
        endpoints:{
          rpc:runner.hq.attr('endpoints.rpc'),
          pub:runner.hq.attr('endpoints.pub'),
          sub:runner.hq.attr('endpoints.sub')
        }
      })

      
      runner.client.plugin(function(){
        runner.warehouse = runner.client.connect('/stack/' + runner.stack.attr('buildid'));
        next();
      })
      
    },

    function(next){

      console.log('-------------------------------------------');
      console.log('appending');
      runner
        .warehouse
        .append(runner.stack)
        .ship(function(){

          console.log('-------------------------------------------');
          console.log('appended');
          next();
        })
      

    },

    function(next){
      fs.readdir(buildfolder + '/run', function(error, sparks){
        async.forEachSeries(sparks, function(spark, nextspark){
          console.log('-------------------------------------------');
          eyes.inspect(spark);
          nextspark();
        }, next)
      })
    }


  ], ready)


}

HQ.prototype.build = function(folder, ready){

  var self = this;
  var runner = {};

  async.series([

    function(next){
      
      self.buildstack(folder, function(error, stack){

        runner.stack = stack;
        
        next();
      })
    },
/*
    function(next){
      
      var hq = this.systemconfig();

      runner.server = Device('hq.server', {
        endpoints:{
          rpc:hq.attr('endpoints.rpc'),
          pub:hq.attr('endpoints.pub'),
          sub:hq.attr('endpoints.sub')
        }
      })

      runner.server.plugin(next);
      
    },
*/
    function(next){
      
      runner.booter = LocalBooter(runner.stack, self.systemconfig);

      runner.booter.build(next);

    }
  ], function(){
    ready(null, runner.booter.id);
  })


}