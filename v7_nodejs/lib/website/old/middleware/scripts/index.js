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
var passport = require('passport');
var fs = require('fs');
var log = require('logule').init(module, 'API Middleware');
var dye = require('dye');
var url = require('url');
var ThreadServer = require('../../../threadserver/server');
/*

  quarry.io - scripts middleware

  enables server-side quarry scripts to run inside a thread server
  
*/


module.exports = function(options, system){

  options || (options = {});

  _.each(['mount'], function(prop){
    if(!options[prop]){
      throw new Error('scripts middleware requires ' + prop + ' in the options');
    }
  })

  var mount = options.mount;

  var supplychain = system.supplychain;
  var switchboard = system.switchboard;

  var worker = system.worker;
  var codefolder = worker.stack.codefolder;

  var server = new ThreadServer({
    supplychain:supplychain,
    codefolder:codefolder
  })

  var projectroutes = options.routes.project;
  var warehouse = supplychain.connect(projectroutes["/"]);

  var script_root = options.script_root;

  return {
    mount:function(app){

      app.use(mount, function(req, res, next){

        var script_file = script_root + req.path;

        fs.readFile(script_file, 'utf8', function(error, content){

          if(error || !content){
            res.statusCode = 404;
            res.send(error);
            return;
          }

          server.script({
            projectroutes:projectroutes,
            fn:content,
            req:{
              url:req.url,
              method:req.method,
              query:req.query,
              headers:req.headers,
              body:req.body
            }
          }, function(error, result){

            if(error){
              res.statusCode = 500;
              res.send(error);
              return;
            }
            else{

              var qres = result.res;
              res.statusCode = qres.statusCode || 200;
              _.each(qres.headers, function(val, key){
                res.setHeader(val, key);
              })
              res.send(qres.body);
            }
            
          })


        })


      })
    }
  }

}