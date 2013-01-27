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
var utils = require('../utils');
var eyes = require('eyes');
var Container = require('../container');
var queries = require('../query/factory');
var EventEmitter = require('events').EventEmitter;

module.exports = Warehouse;

function Warehouse(options){
  options || (options = {});
  this.networkmode = null;
  this.stack = [];
  this.loadingstack = [];
  this.isloading = false;
  this.cache = {};
  this.options = options;
  this.backbonemodel(options.model);
  this.supplychain = null;
  this.id = this.options.id;
  if(!this.id){
    this.id = utils.quarryid(true);
  }
  //this.setup();
  return this;
}

Warehouse.prototype.__proto__ = EventEmitter.prototype;

/*
  Quarry.io - Warehouse
  ---------------------

  The main co-ordinating class for dealing with packets

  The warehouse is basically a router for supply chains

  It presents a middleware stack

  You add middleware based on a route - the packet.route is used

  The middleware is a

    function(req, res, next)

  It does not think about the packet

  the request and response are hooked up by the warehouse

  The warehouse will have supply chains associated with it which packets can be routed to


 */

/*


  Constructor




 */



/*

  Wait for the loader function before we run any requests

 */
Warehouse.prototype.prepare = function(loader){
  var self = this;
  self.isloading = true;
  loader(function(){
    self.isloading = false;
    _.each(self.loadingstack, function(loadedcallback){
      loadedcallback();
    })
  })
  return this;
}


// pass a backbone model to use for the container attr
// any container produced from this warehouse will use this model
Warehouse.prototype.backbonemodel = function(model){
  this.container_factory = Container({
    basemodel:model
  })
  return this;
}

// make a container routing to the top of this warehouse
// and pass it into the contstructor
Warehouse.prototype.ready = function(fn, root_container){

  var self = this;

  if(!root_container || _.isString(root_container)){

    var route = _.isString(root_container) ? root_container : '/';

    root_container = this.container_factory('warehouse', {

    })
    /*

      Makes the warehouse container point to the top (default router)

     */
    .route(route)
    /*

      The QUARRY-SKELETON header will let everything know that the warehouse
      makde the request

     */
    .meta('skeleton', {
      warehouse:true
    })

  }


  /*
  
    Adds the warehouse to the middleware the container will route requests via

   */
  root_container.use(this);

  root_container.networkmode = this.networkmode;

  fn && fn(root_container);

  return this;
}

/*


  Stack




 */

// preapre the stack entry but don't insert it
// this allows us to wrap the function before inserting it
Warehouse.prototype.get_stack_entry = function(route, fn, options){
  var self = this;
  // default route to '/'
  if ('string' != typeof route) {
    options = fn;
    fn = route;
    route = '/';
  }

  options || (options = {});

  // wrap sub-warehouses
  if ('function' == typeof fn.handle) {
    var server = fn;
    fn.route = route;
    fn = function(req, res, next){
      server.handle(req, res, next);
    }
  }

  // strip trailing slash
  if ('/' == route[route.length - 1]) {
    route = route.slice(0, -1);
  }

  return _.extend({ route: route, handle: fn}, options);
}

Warehouse.prototype.usebefore = function(route, fn, options){
  var entry = this.get_stack_entry(route, fn, options);
  this.stack.unshift(entry);
  return this;
}

Warehouse.prototype.use = function(route, fn, options){
  if(!route && !fn){
    throw new Error('There must be a function or a route');
  }
  var entry = this.get_stack_entry(route, fn, options);
  this.stack.push(entry);
  return this;
}

// add a stack function but only if the request method is the same
_.each(['head', 'get', 'post', 'put', 'delete'], function(verb){
  Warehouse.prototype[verb] = function(route, fn, options){
    var self = this;
    var entry = this.get_stack_entry(route, fn, options);
    var orig_fn = entry.handle;
    entry.handle = function(req, res, next){
      if(req.method().toLowerCase()!=verb){
        next();
        return;
      }
      orig_fn(req, res, next);
    }
    self.stack.push(entry);
    return self;
  }
})

// the RPC entry point for a request
Warehouse.prototype.request = function(req, callback){
  var res = queries.response();
  res.on('send', function(){
    callback(res);
  })
  this.handle(req, res);
}

Warehouse.prototype.get_handler = function(){
  return _.bind(this.handle, this);
}

// run the request through the stack
Warehouse.prototype.handle = function(req, res, out) {
  var self = this;
  var stack = this.stack
    , removed = ''
    , index = 0;

  /*
  
    Proxy the request events so the supply chain hears them

   */

  if(this.isloading){
    this.loadingstack.push(function(){
      self.handle(req, res, out);
    })
    return;
  }

  function next(err) {
    var layer, path, status, c;

    if(removed!=''){
      req.unroute();
    }
    
    removed = '';

    // next callback
    layer = stack[index++];

    if(!res){
      return;
    }
    
    // all done
    if (!layer || res.sent) {
      // delegate to parent
      if (out) return out(err);

      res.contentType('text/plain');

      // unhandled error
      if (err){
        res.status(500);
        res.send(err);
      } else {
        res.status(404);
        res.send('cannot find (' + req.method() + ') ' + req.path());
      }
      
      return;
    }

    //try {
      path = req.path();
      if (undefined == path) path = '/';

      // skip this layer if the route doesn't match.
      if (0 != path.toLowerCase().indexOf(layer.route.toLowerCase())) return next(err);

      req.matchroute(layer.route)
      // Call the layer handler
      // Trim off the part of the url that matches the route
      removed = layer.route;

      var arity = layer.handle.length;
      if (err) {
        if (arity === 4) {
          layer.handle(err, req, res, next);
        } else {
          next(err);
        }
      } else if (arity < 4) {
        layer.handle(req, res, next);
      } else {
        next();
      }
    //} catch (e) {
    //  next(e);
    //}
  }
  next();
};


/*

  Inserts a middleware that hooks up a request to the given network client
  before carrying on down the stack

 */
Warehouse.prototype.bootstrap_network = function(deployment, network_client){

  var switchboard = network_client.pubsub();

  this.deployment = deployment;
  this.network_client = network_client;
  
  this.usebefore(function(req, res, next){
    
    req.bootstrap({
      switchboard:switchboard,
      deployment:deployment,

      /*

          req.debug

       */
      debug:function(message){      
      
        if(!req.transactionid()){
          return;
        }
        if(req.debugmode()=='broadcast'){
          switchboard.broadcast('transaction:debug', req.transactionid(), message);  
        }

        
      },

      /*
      
        direct a new request at a certain endpoint in the network

        the path string cuts-out any intermediate routing and the request contains the sub-path
        
      */
      rpc:function(path, req, callback){
        var supplychain = network_client.rpc(location);
        var res = queries.response(callback);

        supplychain(req, res, function(){
          res.send404();
        })

      },

      /*

          req.broadcast

       */
      broadcast:function(channel, route, message){
        if(arguments.length==2){
          message = route;
          route = channel;
          channel = 'container';
        }
        switchboard.broadcast(channel, route, message);
      },


      /*

          req.direct

       */

      direct:function(location){
        var supplychain = network_client.rpc(location);

        if(!supplychain){
          res.send404();
          return;
        }

        supplychain(req, res, next);
      },

      /*

          req.redirect

       */
      redirect:function(location){
        /*
        
          is the request in a holding bay - in which case a redirect involved
          a broadcast to that bay

          otherwise it's a raw supply chain to pipe the request down
          
        */
        if(!req.bayid()){
          if(location=='/'){
            res.send404();
            return;
          }
          var supplychain = network_client.rpc('/');
          req.path(location);
          supplychain(req, res, next);
        }
        else{
          // tell the reception to switch out our callback and
          // trigger the redirected request
          switchboard.broadcast('reception', 'holdingbay.' + req.bayid(), {
            action:'redirect',
            location:location,
            request:req.toJSON()
          })  
        }
        
      },


      /*

          req.branch

       */
      branch:function(request, response){

        if(!req.bayid()){
          return;
        }

        response.add_branch(request);
        
        // tell the reception to switch out our callback and
        // trigger the redirected request
        switchboard.broadcast('reception', 'holdingbay.' + req.bayid(), {
          action:'branch',
          request:request.toJSON()
        })
      }
    })
    
    res.req = req;

    next();
  })

  this.emit('network:assigned', deployment, network_client);
}
