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
var HoldingBay = require('./HoldingBay');
var queries = require('../query/factory');
var router = require('../query/router');

module.exports = function(options){

  return function(warehouse){

    var network = null;
    var switchboard = null;
    var entrypoint = function(req, res, next){
      throw new Error('reception server has not had network assigned');
    }

    var holdingbay = new HoldingBay({
      id:warehouse.id
    })

    

    /*
    
      once the network client has been assigned we setup the listening portals on the switchboard
      
    */
    warehouse.on('network:assigned', function(deployment, network){

      network = network;
      switchboard = network.pubsub();
      
      /*

        get a supply chain to the root for requests

       */
      entrypoint = network.rpc('/');

      switchboard.listen('reception', 'holdingbay.' + warehouse.id, function(message){

        process_broadcast(message);

      })
    })

    /*
    
      the main warehouse routes for the reception
      
    */
    warehouse.post('/transaction', transaction, {
      debug:process.env.NODE_ENV=='development'
    })

    warehouse.use('/request', request, {
      debug:process.env.NODE_ENV=='development'
    })

    /*
    
      this processes broadcasts coming back in from the network in
      order to branch and redirect holdingbay requests
      
    */
    function process_broadcast(message){
      var req = queries.fromJSON(message.request);

      var response_factories = {
        redirect:function(req){
          req.reroute(message.location);
          return holdingbay.redirect(req);
        },
        branch:function(req){
          return holdingbay.branch(req);
        }
      }

      if(!response_factories[message.action]){
        throw new Error('No processor found for: ' + message.action);
      }

      var res = response_factories[message.action].apply(null, [req]); 

      entrypoint(req, res, function(){
        res.send404();
      })
    }


    /*

      FRONT DOOR BRANCH

      this is for when a client container is an array of several models

      then if an 'append' happens we send a packet to /reception/branch
      with the template request and a list of routes

      this handler spawns a new request for each of the routes and triggers 
      a self.request for it

      the index keeps track of which route in a branch is reporting back
      

    {
        id: '8fc0d10b616de32b00e8c450',
        method: 'post',
        body: {
            request: {
                params: {
                    selector: [ 'folder city, apples' ]
                },
                method: 'get'
            },
            routes: [
                { path: '/testdb/23' },
                { path: '/test2/67' }
            ]
        },
        path: '/reception/transaction',
        originalPath: '/reception/transaction'
    }


     */
    function transaction(mainreq, mainres, next){
      
      mainreq.debug({
        location:'reception/transaction',
        action:'start',
        req:mainreq.summary()
      })

      var branches = get_transaction_branches(mainreq, mainres);
      
      /*

        Loop over each skeleton and register the request with the ticket

       */
      async.forEach(branches, function(branch, next_branch){

        mainreq.debug({
          location:'reception/transaction',
          action:'branch',
          req:branch.req.summary()
        })

        entrypoint(branch.req, branch.res, function(){
          branch.res.send404();
        })

      }, function(error){
        
        

      })

    }


    /*

      a straight up request that gets logged with the holdingbay so it can branch
      
    */

    function request(mainreq, mainres, next){

      mainreq.debug({
        location:'reception/request',
        action:'start',
        req:mainreq.summary()
      })

      var ticket = holdingbay.ticket(mainres);

      var branch_res = ticket.add(mainreq);

      mainreq.path(mainreq.intended_path());

      /*
      
        the end of request is fired by the holdingbay which
        has registered mainres into a ticket
        
      */
      mainres.on('send', function(){
        holdingbay.completed(ticket);
      })

      entrypoint(mainreq, branch_res, function(){
        branch_res.send404();
      })

    }

    /*

      knows how to split a transaction request out into the seperate branch requests
      on the network
      
     */
    function get_transaction_branches(mainreq, mainres){
      
      /*
      
        Make a new ticket with the holding bay for this transaction
        
      */
      var ticket = holdingbay.ticket(mainres);

      var router_mode = mainreq.routermode() || 'post';

      /*

        The skeleton of containers that form the context of this transaction

       */
      var skeleton_array = mainreq.contentType()=='quarry/skeleton' ? mainreq.body() : (mainreq.jsonheader('X-QUARRY-SKELETON') || []);

      /*
      
        reset the main request because we have extracted the skeleton from the body
        and are about to duplicate it
        
      */
      mainreq.contentType()=='quarry/skeleton' && mainreq.body('');
      
      /*
      
        we then 'route' the skeleton which works out where to send the request
        for each of the skeletons (based on the method and routes table)
        
      */
      var routed_skeleton_array = _.map(skeleton_array, function(skeleton){

        // get the route for 'into' the container because we are
        return router.skeleton(skeleton, router_mode);
      })

      /*

        We add each top-level branching request to the ticket

       */
      var branches = _.map(routed_skeleton_array, function(singleskeleton){

        

        /*
        
          the request is a skeleton for a PUT request

          we duplicate and route each skeleton as a seperate request
          
        */
        if(mainreq.contentType()=='quarry/skeleton'){

          var branch_req = queries.fromJSON(JSON.parse(JSON.stringify(mainreq.toJSON())));

          
          branch_req.method(branch_req.skeletonmethod());
          branch_req.body([singleskeleton]);
          branch_req.refreshid();
          branch_req.resetroute(':reception', singleskeleton.route);  
        }
        /*
        
          otherwise we are duplicating a template request out for each of the skeletons

          this is for GET, POST and DELETE
          
        */
        else{
          
          var branch_req = queries.fromJSON(JSON.parse(JSON.stringify(mainreq.body())));
          mainreq.copyinto(branch_req);
          branch_req.skeleton([singleskeleton]);
          branch_req.refreshid();
          branch_req.resetroute(':reception', singleskeleton.route);
        }

        var branch_res = ticket.add(branch_req);

        return {      
          req:branch_req,
          res:branch_res
        }
        
      })

      /*
      
        the end of request is fired by the holdingbay which
        has registered mainres into a ticket
        
      */
      mainres.on('send', function(){
        holdingbay.completed(ticket);
      })

      return branches;

    }
  }


}