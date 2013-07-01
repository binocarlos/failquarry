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
var utils = require('../utils');
var util = require('util');
var eyes = require('eyes');
var Warehouse = require('../warehouse');
var Container = require('../container');
var EventEmitter = require('events').EventEmitter;
var crypto = require('crypto');
var Threads = require('threads_a_gogo');
var fs = require('fs');
var deck = require('deck');
var JASON = require('JASON');
var Contract = require('../contract');

module.exports = ThreadServer;

/*
  Quarry.io - Map Thread Server
  -----------------------------

  Keeps a threads-a-go-go thread pool ready for injecting work into


 */

function ThreadServer(options){
  var self = this;
  options || (options = {});
  this.options = options;

  if(!this.options.supplychain){
    throw new Error('Thread Server requires a supplychainclient option');
  }

  if(!this.options.codefolder){
    throw new Error('Thread Server requires a codefolder option');
  }


  this.codefolder = this.options.codefolder;
  this.supplychain = this.options.supplychain;
  
  this.callbacks = {};

  /*
  
    threads by their id
    
  */
  this.pool = [];

  for(var i=0; i<10; i++){
    this.createthread();
  }
}

util.inherits(ThreadServer, EventEmitter);

ThreadServer.prototype.createthread = function(){
  var self = this;
  
  var thread = Threads.create();
  var threadid = utils.quarryid();

  thread.eval("JASON= "+ JASON.stringify(JASON));
  thread.load(this.codefolder + '/browser.js');
  thread.load(__dirname + '/threadcode.js');
  thread.eval('$quarryid = "' + threadid + '";');

  thread.on('log', function(st){
    console.log('-------------------------------------------');
    console.log('thread log');
    console.log(st);
  })

  thread.on('dir', function(obj){
    console.log('-------------------------------------------');
    console.log('thread dir');
    console.dir(obj);
  })

  thread.on('error', function(e){
    console.log('-------------------------------------------');
    console.log('thread error');
    console.log(e);
  })
  
  thread.on('request', function(message){

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('thread request');
    eyes.inspect(message);
    message = JASON.parse(message);

    self.supplychain.rpc(message.routingpacket, message.req, function(packet){
    
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('run response');
      
      thread.emit('response', JASON.stringify({
        id:message.id,
        res:packet
      }))
    })

  })

  thread.on('result', function(message){
    message = JASON.parse(message);
    
    var id = message.id;
    var callback = self.callbacks[id];

    if(!callback){
      return;
    }
    callback(message);
    delete(self.callbacks[id]);
  })

  this.pool.push(thread);
}

ThreadServer.prototype.listen = function(callback){
  
  var self = this;
  
  callback();

}

ThreadServer.prototype.run = function(method, packet, callback){
  var self = this;
  this.callbacks[packet.id] = function(message){

    if(message.error){
      callback(message.error);
      return;
    }
    else{
      callback(null, message);
    }
  }

  var thread = deck.pick(self.pool);
  thread.emit(method, JASON.stringify(packet));
}

/*

  add a function to the thread pool
  
*/
ThreadServer.prototype.map = function(options, callback){
  var self = this;

  var packet = _.extend({}, options, {
    id:utils.quarryid(),
    user:options.user,
    project:options.project,
    fn:options.fn,
    input:options.input
  })

  this.run('map', packet, callback);
}

/*

  add a function to the thread pool
  
*/
ThreadServer.prototype.script = function(options, callback){
  var self = this;

  var packet = _.extend({}, options, {
    id:utils.quarryid(),
    user:options.user,
    project:options.project,
    fn:options.fn,
    req:options.req
  })

  this.run('script', packet, callback);
}
