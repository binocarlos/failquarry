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
var url = require('url');
var express = require('express');
var slashes = require("connect-slashes");
var Chunker = require('./chunker');
var fs = require('fs');
/*

  quarry.io - bootstrap middleware

  delivers the quarry bootstrap API (a combo of Twitter Bootstrap and Google Angular)
  
*/


module.exports = function(options, network){

  var io = network.io;
  var hq = network.hq;
  var receptionfront = network.receptionfront;
  var project = options.project;

  var compiled = {};
  var warehouse = receptionfront.connect(project["/"]);
  var chunker = new Chunker(warehouse);

  var extensions = options.extensions || {
    html:true,
    htm:true
  }
  
  var document_root = options.document_root;

  options || (options = {});

  return function(req, res, next){

    var parsed_url = url.parse(req.url);
    var pathname = parsed_url.pathname;

    fs.stat(document_root + pathname, function(error, stat){

      if(error || !stat){
        res.statusCode = 404;
        res.send('cannot find: ' + pathname);
        return;
      }

      if(stat.isDirectory()){
        if(pathname.substr(-1)!='/'){
          res.redirect(pathname + '/');
          return;
        }
        else{
          pathname += 'index.html';
        }
      }

      var ext = pathname.split('.').pop();

      if(!extensions[ext]){
        res.sendfile(document_root + pathname);
        return;
      }

      fs.readFile(document_root + pathname, 'utf8', function(error, content){

        if(error || !content){
          res.statusCode = 404;
          res.send('cannot find: ' + pathname);
          return;
        }

        content || (content = '');

        var fn = chunker.compile(warehouse, content);

        fn.apply(null, [req, function(error, answer){
          res.send(answer);
        }])
      })
    })
  }
}