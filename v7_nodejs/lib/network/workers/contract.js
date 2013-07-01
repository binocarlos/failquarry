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


var utils = require('../../utils')
  , eyes = require('eyes')
  , async = require('async')
  , _ = require('lodash');

var EventEmitter = require('events').EventEmitter;

var Device = require('../device');
var Warehouse = require('../../warehouse');
var Container = require('../../container');
var Contract = require('../../contract');
var ContractResolver = require('../../warehouse/resolvecontract');

/*

  Quarry.io - Contract
  --------------------

  

  
  
*/

module.exports = function(job){

  job.prepare = function(done){

    var stack = {};

    async.series([
      function(next){
        job.get_reception_back(function(error, warehouse){
          stack.warehouse = warehouse;
          next();
        })
      },

      function(next){
        job.get_reception_front(function(error, receptionfront){
          stack.receptionfront = receptionfront;
          next();
        })
      },

      function(next){
        var supplychain = stack.receptionfront;
        var switchboard = stack.receptionfront.switchboard;
        var bayid = utils.littleid();
        var requests = {};

        

        function factory(req){

          

          var resolveid = null;
          if(req.getHeader('x-quarry-resolveid')){
             resolveid = req.getHeader('x-quarry-resolveid');
          }
          else{
            resolveid = utils.littleid();
            req.setHeader('x-quarry-resolveid', resolveid);
          }
           
          req.setHeader('x-quarry-bayid', bayid);

          var resolving_req = {
            id:req.getHeader('x-quarry-resolveid'),
            branches:{},
            results:[],
            incrementbranch:function(id){
              this.branches[id] || (this.branches[id] = 0);
              this.branches[id]++;
            },
            addbranch:function(id, rawreq){
              var self = this;
              this.incrementbranch(id);
              
              var branchreq = Contract.request(rawreq);
              var branchrequest = factory(branchreq);

              branchrequest.on('complete', function(){
                self.finishbranch(id, branchrequest.results);
              })

              branchrequest.send();
            },
            finishbranch:function(id, results){
              this.incrementbranch(id);
              this.results = this.results.concat(results || []);
              this.checkrespond();
            },
            finishmain:function(res){
              var self = this;
              var branches = res.getHeader('x-json-branches') || [];

              _.each(branches, function(branchid){
                self.incrementbranch(branchid);
              })

              this.results = this.results.concat(res.body || []);
              this.checkrespond();
            },
            checkrespond:function(){
              var stillresolving = (_.filter(this.branches, function(counter){
                return counter<3;
              }))

              if(stillresolving.length<=0){
                this.emit('complete');
              }
            },
            send:function(){
              var self = this;
              var sendres = Contract.response(function(){
                self.finishmain(sendres);
              })
              supplychain(req, sendres, function(){
                sendres.send404();
              })
            }
          }

          _.extend(resolving_req, EventEmitter.prototype);

          requests[resolving_req.id] = resolving_req;
          return resolving_req;
        }

        switchboard.listen('holdingbay.' + bayid, function(message){
          if(message.action=='branch'){
            var requestid = message.requestid;
            
            var request = requests[requestid];
            if(!request){
              return;
            }

            console.log('-------------------------------------------');
            console.log('-------------------------------------------');
            console.log('-------------------------------------------');
            console.log('ADDING BRANCH');
            eyes.inspect(message);

            request.addbranch(message.newid, message.request);
          }
          
        })

        var resolver = ContractResolver(function(req, res, next){
          var resolvingrequest = factory(req);

          resolvingrequest.on('complete', function(){
            res.send(resolvingrequest.results);
          })

          process.nextTick(function(){
            resolvingrequest.send();  
          })
        })

        stack.warehouse.mount('/', resolver);

        next();
      }
    ], done)

  }

  return job;
}