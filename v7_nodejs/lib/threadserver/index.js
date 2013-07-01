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
var utils = require('../utils');
var eyes = require('eyes');
var Warehouse = require('../warehouse');
var ThreadServer = require('./server');

module.exports = factory;

/*
  Quarry.io - Map Thread Server
  -----------------------------

  A function thread server that will do map operations on the input data

  Whatever is emitted is collected and send on

  The map thread server exists in the context of a single result set

  It has no knowledge of it's position in the overall resolving contract


 */

function factory(options){

  var server = new ThreadServer({
    supplychain:options.supplychain,
    codefolder:options.worker.stack.codefolder
  })

  var warehouse = Warehouse();

  warehouse.post(function(req, res, next){

    server.map({
      project:req.getHeader('x-project-route'),
      user:req.getHeader('x-json-quarry-user'),
      fn:req.getHeader('x-quarry-mapfn'),
      input:req.body
    }, function(error, results){
      
      if(error){
        res.error(error);
        return;
      }
      else{
        res.send(results.results);
      }
      
    })
  })

  warehouse.use(function(req, res, next){
    res.send404();
  })

  warehouse.listen = _.bind(server.listen, server);

  return warehouse;
}