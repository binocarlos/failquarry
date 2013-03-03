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

var _ = require('underscore');
var async = require('async');
var eyes = require('eyes');
var Bootloader = require('../bootloader');
var Client = require('./client');
var Emitter = require('events').EventEmitter;

module.exports = Server; 


/*
  Quarry.io - Local - PubSub
  -----------------------

  ZeroMQ server for warehouse PubSub


 */
  
function Server(deployment){
  this.deployment = deployment;
  this.ports = deployment.ports();

  this.build_zeromq();

  this.bootloader = new Bootloader({
    deployment:deployment,
    network:new Client(deployment.toJSON())
  })

  
}

Server.prototype.__proto__ = Emitter.prototype;

Server.prototype.build_zeromq = function(){

}

Server.prototype.build_worker = function(callback){
  callback && callback();
}

Server.prototype.bind = function(fn){
  var self = this;
  this.build_worker(function(){
    console.log('-------------------------------------------');
    console.log('worker built');
    self.zeromq && self.zeromq.bind(fn);  
  })
  
}