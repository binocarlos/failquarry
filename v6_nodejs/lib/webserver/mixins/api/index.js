/*
  Copyright (c) 2012 All contributors as noted in the AUTHORS file

  This file is part of quarry.io

  quarry.io is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  quarry.io is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
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