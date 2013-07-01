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
var express = require('express');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var dye = require('dye');
var engines = require('consolidate');
var poweredBy = require('connect-powered-by');
var url = require('url');
var Middleware = require('./middleware');

/*
 
  A website is an express app mounted with customized middleware to connect back to warehouses

 */

module.exports = function(options){

  /*
  
    the task is a container within the deployment database that represents this website

    it has child tasks that each represent a middleware to mount
    
  */
  var app = express();

  var id = options.id || utils.littleid();
  app.id = id;
  var cookieSecret = options.cookieSecret;
  var cookieParser = options.cookieParser;
  var sessionStore = options.sessionStore;
  var io = options.io;
  var hq = options.hq;
  var project = options.project;
  var document_root = options.document_root;
  var script_root = options.script_root;
  
  var receptionfront = options.receptionfront;
  var cache = options.cache;
  var alias = options.alias || {};
  var wildcard_alias = options.wildcard_alias || {};

  var middleware = options.middleware || {};
  var socketid = utils.littleid();
  app.set('options', _.extend({}, options, {
    socketid:utils.littleid()
  }))
  
  app.plugin = function(done){

    var middlewarefns = [];

    /*
    
      first off lets setup the serving directory and very basic stuff
      we will turn on for all websites (like bodyParser etc)
      
    */
    async.series([
      /*
      
        always apply the basic mixin
        
      */
      function(next){
        /*

          stop the pesky 404's even if they have not specified an icon
          
        */
        app.use(express.favicon(options.favicon));
        

        /*
        
          GET
          
        */
        app.use(express.query());
        app.use(express.responseTime());
        app.use(poweredBy('quarry.io: job ' + options.id));

        /*
        
          POST
          
        */
        app.use(express.bodyParser());

        app.engine('ejs', engines.ejs);
        app.set('view engine', 'ejs');
        app.set('views', __dirname + '/views');

        app.configure('development', function(){
          app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
          app.use(function(req, res, next){

            /*
            
              no-caching unless we are live
              
            */
            res.on('header', function(){
              res.setHeader('cache-control', 'no-cache');
              res.setHeader('pragma', 'no-cache');
              res.setHeader('expires', '-1');
            })
            next();
          })
        })

        app.configure('production', function(){
          app.use(express.errorHandler());
        })
        
        /*
        
          Session
          
        */
        
        app.use(cookieParser);
        app.use(express.session({
          store: sessionStore,
          secret: cookieSecret
        }))

        next();
      },

      function(next){


        async.forEachSeries(middleware, function(middlewareconfig, nextmiddleware){

          _.defaults(middlewareconfig, {
            document_root:document_root,
            script_root:script_root,
            project:project
          })
          
          var fn = Middleware(middlewareconfig, {
            receptionfront:receptionfront,
            cache:cache,
            io:io,
            hq:hq
          })

          if(_.isFunction(fn.configure)){
            fn.configure(app);
          }
          
          /*
          
            is it a mount myself style middleware
            
          */
          if(_.isFunction(fn.mount)){
            middlewarefns.push(function(done){
              fn.mount(app, done);
            })
          }
          else{
            middlewarefns.push(function(done){
              if(fn.route){
                app.use(fn.route, fn);
              }
              else{
                if(middlewareconfig.route){
                  app.use(middlewareconfig.route, fn);  
                }
                else{
                  app.use(fn);
                }
              }
              done();
            })
          }

          nextmiddleware();
          
        }, next)
      },

      function(next){
        app.use(app.router);
        next();
      },

      function(next){
        async.forEachSeries(middlewarefns, function(middlewarefn, done){
          middlewarefn(done);
        }, next)
      }

    ], done)
  }

  return app;
}