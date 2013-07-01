/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


// ORIGINAL CONNECT LICENSE
/*!
 * Connect - HTTPServer
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */


var utils = require('../utils')
  , eyes = require('eyes')
  , _ = require('lodash')
  , async = require('async');

var Container = require('../container');

// prototype

var Warehouse = module.exports = function(){}

// environment

var env = process.env.NODE_ENV || 'development';


Warehouse.prototype.initialize = function(){
  this.route = '/';
  this.stack = [];
  this._prepared = true;
  this._preparestack = [];
  this._mounts = {};
}

/*

  some warehouses need to get stuff ready before they start
  processing requests

    warehouse.prepare(function(finished){
      ... do stuff perhaps async
      finished();
    })
  
*/

Warehouse.prototype.prepare = function(fn){
  var self = this;
  this._prepared = false;
  fn(function(){
    self._prepared = true;
    var callbacks = self._preparestack;
    self._preparestack = [];
    async.forEach(callbacks, function(fn, nextfn){
      fn();
      nextfn();
    }, function(){

    })
  })
}

/*

  I totally stole the connect middleware stack

 */

Warehouse.prototype.use = function(route, fn){
  // default route to '/'
  if ('string' != typeof route) {
    fn = route;
    route = '/';
  }

  // wrap sub-apps
  if ('function' == typeof fn.handle) {
    var server = fn;
    fn.route = route;
    fn = function(req, res, next){
      server.handle(req, res, next);
    };
  }

  /*
  if (fn instanceof http.Server) {
    fn = fn.listeners('request')[0];
  }
  */

  // strip trailing slash
  if ('/' == route[route.length - 1]) {
    route = route.slice(0, -1);
  }

  // add the middleware
  this.stack.push({ route: route, handle: fn });

  return this;
};

/*

  setup the method wrappers (express style)
  
*/
_.each(['head', 'get', 'post', 'put', 'delete'], function(method){
  Warehouse.prototype[method] = function(route, fn){

    if(!fn){
      fn = route;
      route = '/';
    }

    this.use(route, function(req, res, next){
      req.method==method ? fn(req, res, next) : next();
    })
  }
})

/*
 
  a total ripoff of the connect middleware handler

 */

Warehouse.prototype.handle = function(req, res, out) {
  var self = this;

  if(!this._prepared){
    this._preparestack.push(function(){
      self.handle(req, res, out);
    })
    return;
  }

  var stack = this.stack
    , fqdn = ~req.url.indexOf('://')
    , removed = ''
    , slashAdded = false
    , index = 0;

    /*
    
      see if this can free up the spinner
      
    */
  function next(err){
    process.nextTick(function(){
      actualnext(err);
    })
  }

  function actualnext(err) {
    var layer, url, status, c;

    if (slashAdded) {
      req.url = req.url.substr(1);
      slashAdded = false;
    }

    req.url = removed + req.url;
    if(!req.getHeader('x-quarry-url')){
      req.setHeader('x-quarry-url', req.url);
    }
    req.originalUrl = req.originalUrl || req.url;
    removed = '';

    // next callback
    layer = stack[index];
    index++;

    // all done
    if (!layer || res.headerSent) {

      // delegate to parent
      if (out){
        return out(err);
      }

      // unhandled error
      if (err){
        if(!res.statusCode || res.statusCode==200){
          res.statusCode = 500;
        }
        res.error(msg);
      } else {

        res.send404(req.getHeader('x-quarry-url'));
      }
      return;
    }

    /*
    
      THIS SHOULD BE TURNED BACK ON!!!
      
    */
    //try {

      url = req.url;

      if (undefined == url) url = '/';

      // skip this layer if the route doesn't match.
      if (0 != url.toLowerCase().indexOf(layer.route.toLowerCase())) return next(err);

      c = url[layer.route.length];
      if (c && '/' != c && '.' != c) return next(err);

      // Call the layer handler
      // Trim off the part of the url that matches the route
      removed = layer.route;
      req.url = req.url.substr(removed.length);

      // Ensure leading slash
      if (!fqdn && '/' != req.url[0]) {
        req.url = '/' + req.url;
        slashAdded = true;
      }

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
      //next(e);
    //}
  }
  next();
};

/*

  create a general container to hold the configuration for this supplier
  
*/
Warehouse.prototype.configure = function(options){
  this.config = Container.new('options', options);
  return this;
}

Warehouse.prototype.get_mounts = function(socketid){
  var ret = {};
  _.each(_.keys(this._mounts), function(route){
    ret[route] = socketid;
  })
  return ret;
}

/*

  get a container that uses this warehouse as a supplychain
  
*/
Warehouse.prototype.connect = function(stackpath){
  return Container.connect(this, stackpath);
}

/*

  a 'proper' use command that injects the stackpath
  into requests such that it does not matter now the
  requests chunk down the path we can always stamp
  container with their true (absolute) stack path
  
*/

Warehouse.prototype.mount = function(stackpath, fn){

  var self = this;

  if(!fn){
    fn = stackpath;
    stackpath = {
      department:this.department || 'warehouse',
      route:'/'
    }
  }

  if(_.isString(stackpath)){
    stackpath = {
      department:this.department || 'warehouse',
      route:stackpath
    }
  }

  var mount = stackpath.department + ':' + stackpath.route;
  this._mounts[mount] = this._socketid ? this._socketid : true;

  /*

     this is the initial spark for a request entering this supplychain
    
  */
  function bootstrap_request(bootstrapreq){
    /*
  
      when a request ends up server side we stamp it with the stackpath
      which a supplier can then use to stamp containers with the route

      this is used by handlers to know where on the stack we are being invoked from
      
    */
    //bootstrapreq.setHeader('x-quarry-department', stackpath.department);
    bootstrapreq.setHeader('x-quarry-supplier', stackpath.route);
    bootstrapreq.setHeader('x-quarry-stack', self.stackid);
    
    /*
    
      setup the switchboard onto requests so we can do server side
      portal broadcasts
      
    */
    if(!bootstrapreq.switchboard){
      bootstrapreq.switchboard = self.switchboard;
    }

    bootstrapreq.on('debug', function(message){
      var debugid = bootstrapreq.getHeader('x-quarry-debug-id');
      if(!debugid){
        return;
      }

      self.switchboard.broadcast('debug:' + debugid, message);
    })
    
    /*
    
      hookup the bootstrap feature for sub-requests
      
    */
    bootstrapreq.on('bootstrap', bootstrap_request);
  }

  function handle(req, res, next){
    bootstrap_request(req);
    process.nextTick(function(){
      fn(req, res, next);  
    })
  }

  this.use.apply(this, [stackpath.route, function(req, res, next){
    if(req.getHeader('x-quarry-department')!=stackpath.department){
      next();
      return;
    }

    handle(req, res, next);
  }])
}