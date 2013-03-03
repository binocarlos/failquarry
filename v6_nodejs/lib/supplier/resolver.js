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
var utils = require('../utils');
var eyes = require('eyes');
var Backbone = require('../vendor/backbone');
var selectorFactory = require('../query/selector');
var Request = require('../query/request');
var Response = require('../query/response');
var router = require('../query/router');

/*
  Quarry.io - Resolver
  --------------------

  Handles a single supplier selector query

  It knows how to pipe and merge the whole selector contract


 */

exports = module.exports = factory;

function pipe(options, callback){
  options || (options = {});

  var list = ([]).concat(options.list || []);
  var run = options.run;
  var input = options.input || [];

  var active = true;
  var counter = 0;

  async.whilst(function(){
    return list.length>0 && active;
  }, function(next){
    var item = list.shift();

    run({
      item:item,
      remaining:list,
      input:input,
      counter:counter
    }, function(error, results){
      if(error){
        callback(error);
        return;
      }
      else if(results && results.length==0){
        callback(null, []);
        return;
      }
      input = results;
      counter++;
      next();
    })
    
  }, function(error){
    callback(error, input);
  })
}

function merge(options, callback){
  options || (options = {});

  var list = ([]).concat(options.list || []);
  var run = options.run;
  var input = options.input || [];
  var counter = 0;

  var allresults = [];

  async.forEach(list, function(item, next_item){
    run({
      item:item,
      input:input,
      counter:counter
    }, function(error, results){
      allresults = allresults.concat(results);
      counter++;
      next_item();
    })
  }, function(error){
    callback(error, allresults);
  })
}

function factory(options){
  options || (options = {})
  var supplychain = options.supplychain;
  var mainreq = options.req;
  var mainres = options.res;

  var skeleton = mainreq.skeleton();
  var selectors = mainreq.selectors();

  var router_mode = mainreq.routermode() || 'post';

  // the strings: "folder > city", "context"
  pipe({
    list:selectors,
    input:skeleton,
    run:function(stringstate, pipe_callback){
      
      // the phases: folder, otherthing
      merge({
        list:stringstate.item,
        input:stringstate.input,
        run:function(phasestate, merge_callback){

          // the stages: a > b
          pipe({
            list:phasestate.item,
            input:phasestate.input,
            run:function(stagestate, select_callback){

              /*
              
                Knows how to extract the current status of selector
                array from the reduction loop
                
              */
              function get_branch_selectors(){

                var branch_selectors = ([]).concat(stagestate.remaining)
                branch_selectors.unshift(stagestate.item);
                var branch_phase = [branch_selectors];
                var branch_strings = ([]).concat(stringstate.remaining)
                branch_strings.unshift(branch_phase);

                return branch_strings;

              }

              var selector = stagestate.item;
              
              // this means we are returning the final stage of results and should include our route
              var includedata = stringstate.counter >= selectors.length-1 && stagestate.counter >= phasestate.item.length-1;

              // this means the selector states we want a tree in the results
              var includechildren = selector.modifier && selector.modifier.tree;

              /*

                This request we fire into our supply chain as normal runnings

               */
              var req = new Request({
                method:'get',
                path:'/'
              })

              mainreq.copyinto(req);
              
              req.param('includedata', includedata);
              req.param('includechildren', includedata && includechildren);

              // here is where we branch based on the provided skeleton
              var normal_skeleton = [];
              var branch_requests = [];

              _.each(stagestate.input, function(check_skeleton){
                var branch_route = router.branch(check_skeleton, router_mode);

                /*
  
                  The container has branched - tell the reception holdingbay

                 */
                if(stagestate.counter>0 && branch_route){
                  
                  
                  var skeleton = router.skeleton(check_skeleton, router_mode);
                  var branchreq = req.clone();

                  branchreq.skeleton([skeleton]);
                  branchreq.selectors(get_branch_selectors());
                  branchreq.resetroute(':reception', skeleton.route);

                  /*
                  
                    tell the main response that it has triggered a branch

                    this lets the holdingbay know there is still more stuff to load
                    when it gets the main response back

                    
                  */
                  branch_requests.push(branchreq);
                  //mainreq.branch(branchreq, mainres);

                  
                  
                }
                else{
                  normal_skeleton.push(check_skeleton);  
                }
              })

              /*
              
                emit the branches in parallel before then piping the actual request
                
              */
              async.forEach(branch_requests, function(branch_request, next_request){
                mainreq.branch(branch_request, mainres);
                next_request();
              }, function(){

                req.selector(selector);
                req.skeleton(normal_skeleton);

                var res = new Response();

                /*

                  Results callback

                 */

                res.on('send', function(){

                  // if we have an error then add it to the main request
                  if(res.hasError()){
                    mainres.addMultipart(res);
                    pipe_callback && pipe_callback();
                    return;
                  }
                  // check if we are on the last stage - in which case
                  // lets include the results in the main request
                  
                  if(includedata){
                    mainres.addMultipart(res);
                    select_callback && select_callback();
                  }
                  // otherwise pipe the data through the resolver
                  else{
                    select_callback && select_callback(null, res.body());
                  }
                })

                /*

                  Run request

                 */
                
                supplychain(req, res, function(){
                  select_callback && select_callback(null, []);
                })
              })
              
            }
          }, merge_callback);
        }
      }, pipe_callback);
    }
  }, function(error){

    if(error){
      mainres.sendError(error);
    }
    else{

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log(JSON.stringify(mainres.toJSON(), null, 4));
      mainres.send();
    }
  })

  
}