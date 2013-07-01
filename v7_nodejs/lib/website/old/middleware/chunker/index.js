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
var express = require('express');
var fs = require('fs');
var log = require('logule').init(module, 'Chunker Middleware');
var dye = require('dye');
var url = require('url');
var ThreadServer = require('../../../threadserver/server');
var Chunker = require('./chunker');
/*

  quarry.io - chunker middleware

  processes any HTML files for quarry tags that might be processed
  by a script server
  
*/


module.exports = function(middlewareoptions, network){

  var supplychain = system.supplychain;
  var switchboard = system.switchboard;

  var worker = system.worker;
  var codefolder = worker.stack.codefolder;

  var server = new ThreadServer({
    supplychain:supplychain,
    codefolder:codefolder
  })


  var projectroutes = middlewareoptions.routes.project;
  var warehouse = supplychain.connect(projectroutes["/"]);

  var chunker = new Chunker(warehouse);

  var extensions = middlewareoptions.extensions;
  var document_root = middlewareoptions.document_root;

  return function(req, res, next){

    var pathname = url.parse(req.url).pathname;
    if(!pathname.match(/\.\w+$/)){
      pathname += 'index.html';
    }

    var ext = pathname.split('.').pop();

    if(!extensions[ext]){
      next();
      return;
    }

    var filepath = document_root + pathname;

    fs.readFile(filepath, 'utf8', function(error, content){
      if(error || !content){
        next();
        return;
      }

      var fn = chunker.compile(warehouse, content);

      fn(function(error, result){
        res.send(result);
      })
    })
  }
  
}