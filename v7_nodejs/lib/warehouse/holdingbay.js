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
var deck = require('deck');
var util = require('util');
var utils = require('../utils');
var EventEmitter = require('events').EventEmitter;

var Contract = require('../contract');
var ContractResolver = require('./resolvecontract');
var ResolvingRequest = require('./resolvingrequest');

module.exports = HoldingBay;

/*
  Quarry.io - Contract Holdingbay
  -------------------------------

  keeps hold of the resolving contracts

  listens on the switchboard for feedback loops

 */

function HoldingBay(options){

  var supplychain = options.supplychain;
  var receptionfront = supplychain.connect('/');

  if(!supplychain){
    throw new Error('HoldingBay Server requires a supplychain');
  }

  var switchboard = supplychain.switchboard;

  var holdingbay = {
    /*
    
      the id that will be used on the switchboard feedback loop
      
    */
    id:utils.littleid(),

    /*
    
      a map of currently resolving contracts by id

      each entry is an array of objects representing the queries status

      if a query branches at any point then it's representation will be added
      to the array of queries tagged by the original request id

      the new branch is sent out as it's own contract but the results
      sent and monitored here
      
    */
    resolving:{},

    /*
    
      a list of functions to call for a stampid response
      
    */
    triggers:{},

    handle:function(mainreq, mainres, next){
      var self = this;

      /*
      
        are we resolving a contract here
        
      */
      if(mainreq.getHeader('content-type')=='quarry/contract'){
        self.handlecontract(mainreq, mainres, function(){
          mainres.send404();
        })
      }
      /*
      
        or are we routing the request directly
        
      */
      else{

        self.handlerequest(mainreq, mainres, function(){
          mainres.send404();
        })

      }

    },

    handlecontract:function(req, res, next){
      var self = this;
      self.contractresolver(req, res, next);
    },

    /*
    
      a single request that might branch

      we hold back from the callback until all branches are resolved
      
    */
    handlerequest:function(req, res, next){
      var self = this;

      var resolve = new ResolvingRequest(self.id, req, res);
      this.resolving[resolve.id] = resolve;

      resolve.on('complete', function(){
        setTimeout(function(){
          delete(self.resolving[resolve.id]);  
        }, 5000);
      })

      receptionfront(req, res, next);

      return resolve;
    },

    /*
    
      a branch feedback adds another request to the contract
      and sends it through ourselves to resolve recursively
      
    */
    feedback:function(message){
      var self = this;

      if(message.action=='branch'){

        var parentstampid = message.stampid;
      
        var branchreq = Contract.request(message.request);
        var branchstampid = branchreq.getHeader('x-quarry-baystampid')

        /*
        
          add in the branch to the parent resolve
          
        */
        var resolve = this.resolving[parentstampid];

        if(!resolve){
          throw new Error('there was switchboard feedback but no resolve for id: ' + parentstampid);
        }

        /*
        
          tell the resolve we are waiting for a branch
          
        */
        resolve.branch(branchstampid);

        /*
        
          this is for when the branch has completed

          it has it's own branching sub-system also
          
        */
        var branchres = Contract.response(function(){
          resolve.branchcomplete(branchstampid, branchres);
        })

        self.handlerequest(branchreq, branchres, function(){
          branchres.send404();
        })
      }
    }
  }

  _.extend(holdingbay, EventEmitter.prototype);

  var supplychain = _.bind(holdingbay.handle, holdingbay);
  supplychain.switchboard = switchboard;

  var resolver = ContractResolver(supplychain);

  holdingbay.contractresolver = resolver;

  switchboard.listen('holdingbay.' + holdingbay.id, function(message){

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('feedback!');
    console.log((new Date()).getTime());
    holdingbay.feedback(message);

  })

  return holdingbay;
}