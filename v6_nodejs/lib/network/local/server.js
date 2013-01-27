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