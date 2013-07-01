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
var util = require('util');
var utils = require('../utils');
var Request = require('./request');
var Response = require('./response');
var eyes = require('eyes');

/*
  Quarry.io - Contract
  --------------------

  A promise based object that acts as the bridge between a container
  and it's API and the low level REST requests that are sent to the network

  The contract is returned from the following container methods:

    selector
    append
    save
    delete

  The 'ship' method acts as a common trigger for a contract (i.e. send it)

  A contract can also be combined into a larger one for piping and merging together

 */

module.exports = Contract;

function Contract(data){
  Request.apply(this, [data]);
  this.setHeader('content-type', 'quarry/contract');
  this.getHeader('x-contract-id') || (this.setHeader('x-contract-id', utils.quarryid()));
  this.getHeader('x-contract-type') || (this.setHeader('x-contract-type', 'merge'));
  this.getHeader('x-quarry-department') || (this.setHeader('x-quarry-department', 'contract'));
  this.setType('merge');
  this.method = 'post';
  this.children = [];
  this.printlog = [];
  this.debugcallbacks = [];
  this.setMaxListeners(1000);
}

util.inherits(Contract, Request);


Contract.prototype.toJSON = function(){
  
  var ret = Request.prototype.toJSON.apply(this);
  /*
  
    save the double contract when there was only one container

    i.e. if the container has 2 things and we ship - the top contract is a wrapper for those 2

    if there is only one thing in the container though - this is a waste of a loop around the
    contract resolver so we just bump the top contract for the single child
    
  */
  if(this.children.length==1 && this.children[0].getHeader('content-type')=='quarry/contract'){
    var firstreq = this.children[0];
    this.inject(firstreq);
    return firstreq.toJSON();
  }
  else{
    
    ret.body = _.map(this.children, function(child){
      return child.toJSON();
    })  
  }
  
  
  return ret;
}


/*

  trigger the network request
  
*/
Contract.prototype.ship = function(fn){
  var self = this;

  if(!this.supplychain){
    throw new Error('contract trying to ship with no supplychain');
  }
  
  var requestmap = {};

  var mainres = Response.factory(function(){
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('at contracr ret');

    self.debugfn && self.debugfn(mainres.toJSON());
    self.emit('ship', mainres);
    var answer = self.map_response(mainres);
    if(self.sortfn && _.isFunction(answer.sort)){
      answer.sort(self.sortfn);
    }
    fn && fn.apply(answer, [answer, mainres]);
  })

  self.supplychain && self.supplychain(self, mainres, function(){
    mainres.send404();
  })

  return this;
}

Contract.prototype.sort = function(sortfn){
  sortfn && (this.sortfn = sortfn);
  return this;
}

Contract.prototype.debug = function(fn){
  var self = this;
  if(arguments.length>0){
    var debugid = utils.littleid();
    this.debugfn = fn;
    this.setHeader('x-quarry-debug-id', debugid);
    if(this.supplychain){
      this.on('ship', function(){
        self.supplychain.switchboard.cancel('debug:' + debugid);
      })
      this.supplychain.switchboard.listen('debug:' + debugid, fn);
    }
    return this;
  }
  else{
    return this.getHeader('x-quarry-debug-id');
  }
}

Contract.prototype.title = function(title){
  arguments.length>0 && (this._title = title);
  return this;
}

Contract.prototype.recurse = function(fn){

  function runres(req){
    fn && fn(req);

    if(req.isContract()){
      _.each(req.children || [], function(subreq){
        runres(subreq);
      })
    }
  }

  runres(this);
}

/*

  auto map the return into something useful (like containers)
  
*/
Contract.prototype.expect = function(type){
  var self = this;
  if(!type){
    type = 'array';
  }
  
  function get_array_results(res){
    if(res.hasError()){
      return [];
    }
    var arr = [];

    /*
      
      do a check to see if we have a flat container array
      inside a multipart response (i.e. the results have multiple sources)

      NOTE - generally I am a numpty and have run out of rocket juice
      and so this is something that needs to be looked at later
      (i.e. the response should not be multipart - the whole request / response tree
      thingy is something that needs sorting - at the moment it flattens where it should
      have some clue as to the request tree that went as to the response tree that comes back

      arr = arr.concat(subresponse.body)

      is the current way (i.e. nuke the tree - just append whatever results you get)

      BAD! (but time to get this shipped innit)
    */
    var firstcontainertest = _.isArray(res.body) ? res.body[0] : null;

    /*
    
      the inside of the content check to see if it's containers
      
    */
    if(firstcontainertest && firstcontainertest.meta){
      return res.body;
    }

    res.recurse(function(res){
      if(res.isContainers()){
        arr = arr.concat(res.body);
      }
    })
    return arr;
  }
  /*
  
    we are expecting containers back so use spawn
    
  */
  if(type.indexOf('container')==0 && this.container){
    this.map_response = function(res){
      var arr = get_array_results(res);
      return self.container.spawn(arr || []);
    }
  }
  else if(type.indexOf('array')==0){
    this.map_response = function(res){
      return get_array_results(res);
    }
  }
  else if(type.indexOf('first')==0){
    this.map_response = function(res){
      return (res.body || [])[0];
    }
  }
  return this;
}

/*

  merge or pipe
  
*/
Contract.prototype.setType = function(type){
  this.setHeader('x-contract-type', type);
  return this;
}

/*

  this takes the output of the current contract
  and pipes it into the given map function

  it creates a top level contract as oursevles to hold the pipe
  
*/
Contract.prototype.map = function(fn){
  var thischild = new Request(JSON.parse(JSON.stringify(this.toJSON())));

  this.setHeader('content-type', 'quarry/contract');
  this.getHeader('x-contract-id') || (this.setHeader('x-contract-id', utils.quarryid()));
  this.setType('pipe');
  this.method = 'post';
  this.children = [thischild];

  var mapcontract = new Request({
    method:'post',
    url:'/'
  })

  mapcontract.setHeader('content-type', 'quarry/map');
  mapcontract.setHeader('x-quarry-mapfn', fn.toString());
  mapcontract.setHeader('x-quarry-department', 'code');
  this.add(mapcontract);
  return this;
}

/*

  add a request/other contract to the sequence
  
*/
Contract.prototype.add = function(req){
  var self = this;

  req.getHeader('x-contract-id') || (req.setHeader('x-contract-id', utils.quarryid()));
  this.children.push(req);
  this.body || (this.body = []);

  this.body.push(req.toJSON());

  _.each(req.listeners('ship'), function(fn){
    self.on('ship', fn);
  })
  
  return this;
}

/*

  turn the response into the context needed
  
*/
Contract.prototype.map_response = function(res){
  return res;
}