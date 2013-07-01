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
var log = require('logule').init(module, 'Digger Middleware');
var dye = require('dye');
var url = require('url');
var express = require('express');
var Bootstrap = require('../../bootstrap');

/*

  quarry.io - bootstrap middleware

  delivers the quarry bootstrap API (a combo of Twitter Bootstrap and Google Angular)
  
*/


module.exports = function(options, system){

  options || (options = {});

  _.each(['mount'], function(prop){
    if(!options[prop]){
      throw new Error('bootstrap middleware requires ' + prop + ' in the options');
    }
  })

  var routes = options.routes;
  var supplychain = system.supplychain;
  var mount = options.mount;

  /*
  
    the static serving middleware for all the bootstrap js / css
    
  */
  var bootstrap = Bootstrap();
    
  return {
    mount:function(app){
      
      var warehouseroute = app.options.routes.warehouse;

      app.use(mount, bootstrap);
      app.use(mount, express.static(__dirname + '/www'));
      

      /*
      
        get onto the directory index by default (appname/ not just appname)
        
      */
      app.get(mount, function(req, res, next){

        if(!req.originalUrl.match(/\/$/)){
          res.statusCode = 301;
          res.setHeader('Location', req.path + '/');
          res.end('Redirecting to ' + req.path + '/');
          return;
        }

        var origviews = app.get('views');
        app.set('views', __dirname + '/views');
        app.render('main', {
          url:req.path.replace(/\/$/, ''),
          warehouse:warehouseroute
        }, function(error, content){
          res.send(content);
        })
        app.set('views', origviews);

      })

      
    }
  }

}