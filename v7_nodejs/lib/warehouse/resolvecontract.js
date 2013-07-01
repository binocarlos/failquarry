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
var dye = require('dye');
var contractfactory = require('../contract');

/*
  Quarry.io - Contract Resolver
  -----------------------------

  Middleware that knows how to merge and pipe

  You provide it with a handler function to issue
  indivudal requests to




 */

module.exports = factory;

/*

  we give the supplychain to pipe our requests back around

  if we are given a switchboard then we operate in 'holdingbay' mode
  (i.e. we are able to branch requests around)

  networkmode means we are running on a contract worker and not in situe
  alongside the supplier function

  if we are not in network mode
  
*/
function factory(supplychain, networkmode){

  if(!supplychain){
    throw new Error('Select resolver requires a supplychain client');
  }

  /*
  
    decide whether to pipe a request back to ourselves
    or if it's a plain request then back to the supplychain
    
  */
  function router(req){
    return req.getHeader('content-type')=='quarry/contract' ? handle : supplychain;
  }

  function runrequest(req, res){
    process.nextTick(function(){

      var fn = router(req);
      fn(req, res, function(){
        res.send404();
      })

    })
  }

  var resolvers = {

    /*
    
      run each contract request in parallel and merge the results
      into a single response
      
    */
    merge: function(contract, mainres){

      var merge = [];

      contract.emit('debug', {
        location:'contract resolver',
        action:'merge',
        count:contract.body.length
      })
      
      async.forEach(contract.body, function(reqdata, next){

        var req = contractfactory.request(reqdata);

        contract.inject(req);
        //contract.emit('bootstrap', req);

        contract.emit('debug', {
          location:'contract resolver',
          action:'merge:child',
          req:req.summary()
        })

        var res = contractfactory.response(function(){
          contract.emit('debug', {
            location:'contract resolver',
            action:'merge:child:results',
            data:res.body
          })
          mainres.add(res);
          next();
        })

        runrequest(req, res);

      }, function(){

        mainres.setHeader('x-contract-id', contract.getHeader('x-contract-id'));
        mainres.send();

      })

    },

    /*
    
      run each contract request in order and pass the results
      from each to the next
      
    */
    pipe: function(contract, mainres){

      /*
      
        we pass this onwards through the stack
        
      */
      var lastresults = null;

      contract.emit('debug', {
        location:'contract resolver',
        action:'pipe',
        count:contract.body.length
      })
      
      async.forEachSeries(contract.body, function(reqdata, next){

        var req = contractfactory.request(reqdata);
        contract.inject(req);
        contract.emit('bootstrap', req);

        if(lastresults){
          req.body = lastresults;
        }
        
        var res = contractfactory.response(function(){

          process.nextTick(function(){
            
            /*
            
              when we are piping we bail out at the first error
              
            */
            if(res.hasError()){
              mainres.error(res.body);
              return;
            }
            
            lastresults = res.body;

            if(_.isEmpty(lastresults)){
              mainres.send();
            }
            else{
              next();
            }
          })
        })

        contract.emit('debug', {
          location:'contract resolver',
          action:'pipe:child',
          req:req.summary()
        })

        process.nextTick(function(){
          var fn = router(req);
          fn(req, res, function(){
            res.send404();
          })
        })
        

      }, function(){

        mainres.setHeader('x-contract-id', contract.getHeader('x-contract-id'));
        mainres.json(lastresults).send();
      })

    }
  }



  function handle(req, res, next){
    /*
    
      we are only interested in quarry/contracts here
      
    */
    if(req.getHeader('content-type')!='quarry/contract'){
      next();
      return;
    }

    req.emit('debug', {
      location:'contract resolver',
      action:'entry',
      req:req.summary()
    })

    var type = req.getHeader('x-contract-type');
    var resolver = resolvers[type];

    if(!resolver){
      next();
      return;
    }

    var parts = req.body.length;

    if(parts<=0){
      res.send();
      return;
    }

    process.nextTick(function(){
      resolver(req, res, next);  
    })
  }



  return handle;
}

