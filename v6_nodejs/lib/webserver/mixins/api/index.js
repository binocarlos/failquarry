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

var _ = require('underscore');
var async = require('async');
var utils = require('../../../utils');
var eyes = require('eyes');
var express = require('express');
var queries = require('../../../query/factory')
/*

  HTTP API access mixin
  
*/

module.exports.route = function(options, callback){

  var app = options.app;
  var website_options = options.website_options;
  var network_client = options.network_client;
  var mixin_options = options.mixin_options;

  var route = mixin_options.route;
  

  app.all(route + '/*', function(httpreq, httpres, httpnext){

    var subpath = httpreq.path.substr(route.length);

    var rpcreq = queries.request();
    var rpcres = queries.response(function(res){
      httpres.json(res.toJSON());
    })

    if(httpreq.user){
      rpcreq.user(httpreq.user);  
    }
    
    rpcreq.headers(httpreq.headers);
    rpcreq.params(httpreq.query);
    rpcreq.intended_path(subpath);
    rpcreq.path('/reception/request');
    rpcreq.method(httpreq.method.toLowerCase());

    var supplychain = network_client.rpc('/');

    supplychain(rpcreq, rpcres, function(){
      httpres.send404();
    })
  })

  callback();
}