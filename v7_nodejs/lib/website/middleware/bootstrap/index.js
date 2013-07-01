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

/*

  quarry.io - bootstrap middleware

  delivers the quarry bootstrap API (a combo of Twitter Bootstrap and Google Angular)
  
*/

var javascripts = [
  '/vendor/angular.js',
  '/vendor/ui.bootstrap.js',

  '/app.js',

  '/services/warehouse.js',
  
  '/directives/navbar.js',
  '/directives/tree.js',
  '/directives/viewer.js',
  '/directives/digger.js',

  '/controllers/digger.js',
  '/controllers/auth.js'
]


var footerfiles = []

module.exports = function(options, network){

  var route = options.route;


  return {
  	mount:function(app, done){

      var appoptions = app.get('options');
      var hostname = appoptions.hostnames[0];

      /*
      
        write in the CSS and Angular JS at the top of the page

        they should have put:

        <script src="/.../app.js" />

        in their page
        
      */
      app.get(route + '/quarry.js', function(req, res, next){
        var output = [];
        _.each(javascripts, function(js){
          var url = js.indexOf('http://')==0 ? js : 'http://' + hostname + route + js;
          output.push('document.write(\'<script src="' + url + '"></script>\');');
        })
        output = output.join("\n");
        res.header('Content-Type', 'application/javascript');
        res.send(output);
      })

      app.use(route, express.static(__dirname + '/www'));

      done();
  	}
  }
}