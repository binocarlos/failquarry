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


var utils = require('../utils')
  , eyes = require('eyes')
  , _ = require('lodash');

var Contract = require('../contract');
var Container = require('../container');
var Warehouse = require('../warehouse');

var stampcontainers = require('./middleware/stampcontainers');
var resolveselector = require('./middleware/resolveselector');
var extractmeta = require('./middleware/extractmeta');
var extractselector = require('./middleware/extractselector');
var resolvecontract = require('./middleware/resolvecontract');
var containerportals = require('./middleware/containerportals');

/*

  Quarry.io - Container Supplier
  ------------------------------

  mounts the warehouse routes to deal with REST requests

  The following functions can be defined with the api that you provide:

    meta - just return the meta data for container(s)

      - quarryid (the singlecontext)
      OR
      - skeleton (the skeleton context)
      
    select - a single selector for either an id or skeleton array

      - selector (single stage selector object)

      - quarryid (the singlecontext)
      OR
      - skeleton (the skeleton context)

      - include_children (whether to do a 2nd hit for children)
      - include_attr (whether to return full data or just a skeleton)

    append - add a container

      - parentid
      - data

    save - save a container

      - quarryid
      - data

    delete - delete a container

      - quarryid
  
*/

function blankhandler(req, res, next){
  next();
}

module.exports = function(options){

  options || (options = {});

  var app = Warehouse();

  /*
  
    a self-referential contract resolver
    so we can speak directly to containers
    
  */

  // debugging function for anything through a container supplier
  /*
  app.use(function(req, res, next){

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('RUNNING CONTAINER');
    eyes.inspect(req.toJSON());
    res.on('send', function(){
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('CONTAINER SEND');
      eyes.inspect(res.toJSON());

    })
    next();
  })
  

  app.use(function(req, res, next){
    res.setHeader('content-type', 'quarry/containers');
    next();
  })
*/


  /*
  
    we always want the skeleton extracted
    
  */
  app.use(extractmeta());
  //app.use(resolvecontract(app));

  app.stampwrapper = function(options){
    /*
  
      setup the data stamper with the portal router of the actual supplier
      (this extracts a materialized path from container meta data so we
      can get a global tree based subscription routing key)
      
    */
    //app.use(stampcontainers(options));  
  }
  

  app.portalwrapper = function(options){
    /*
    
      emit the events after the response is sent
      
    */
    //app.use(containerportals(options));  
  }


  /*
  
    GET
    
  */
  app.selectwrapper = function(handle){
    app.get(extractselector());
    var resolver = resolveselector(handle, options);
    app.get(function(req, res, next){
      resolver(req, res, next);
    })
  }

  app.getwrapper = function(handle){
    app.get(function(req, res, next){
      handle(req, res, next);
    })
  }  

  /*
  
    POST
    
  */

  app.appendwrapper = function(handle){
    app.post(function(req, res, next){
      req.emit('portal', 'container');
      handle(req, res, next);
    })
  }


  /*
  
    PUT
    
  */

  app.savewrapper = function(handle){
    app.put(function(req, res, next){
      req.emit('portal', 'container');
      handle(req, res, next);
    })
  }

  /*
  
    DELETE
    
  */

  app.deletewrapper = function(handle){
    app.delete(function(req, res, next){
      req.emit('portal', 'container');
      handle(req, res, next);
    })
  }

  return app;

}