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
var EventEmitter = require('events').EventEmitter;

module.exports = ResolvingRequest;

/*
  Quarry.io - Resolving Request
  ------------------------------

  represents a single backend query that might branch

 */

function ResolvingRequest(options){

  var self = this;

  EventEmitter.call(this);

  options || (options = {});

  var bayid = options.bayid;
  
  var req = options.req;
  var res = options.res;

  var parent_request = options.parent;
  var stampid = utils.quarryid();

  req.setHeader('x-quarry-bayid', bayid);
  req.setHeader('x-quarry-baystampid', stampid);

  var send_res = Contract.response(function(){
    self.maincomplete(send_res);
  })

  this.bayid = bayid;
  this.id = stampid;
  this.requests = {};
  this.finished = {};
  this.mainreq = req;
  this.mainres = res;

  this.branch(stampid);
}

util.inherits(ResolvingRequest, EventEmitter);

ResolvingRequest.prototype.trigger = function(){
  var is_complete = _.every(this.requests, function(val){
    return val;
  })

  if(is_complete){
    this.emit('complete');
    this.mainres.send();
  }
}

ResolvingRequest.prototype.branch = function(id){
  this.requests[id] = false;
  return this;
}

ResolvingRequest.prototype.branchcomplete = function(id, res){
  this.requests[id] = true;
  this.mainres.add(res);
  this.trigger();
}

ResolvingRequest.prototype.maincomplete = function(res){
  var self = this;
  // ON MAIN COMPLETE
  this.requests[this.id] = true;
  this.mainres.add(res);

  var branches = res.getHeader('x-json-branches') || {};

  /*
  
    the request has branched - trigger the branches
    then give one tick to settle down before triggering the
    main response
    
  */
  _.each(branches, function(v, branchid){
    self.branch(branchid);
  })

  process.nextTick(function(){
    self.trigger();  
  })
}