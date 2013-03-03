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
var passport = require('passport');
var fs = require('fs');
var queries = require('../../../query/factory');
var RedisStore = require('../../tools/redisstore')(express);

var providers = {};

_.each(fs.readdirSync(__dirname + '/providers'), function(filename){
  var provider_name = filename.replace(/\.js$/, '');

  providers[provider_name] = require('./providers/' + provider_name);
})

/*

  HTTP AUTH mixin
  
*/
module.exports.configure = function(options, callback){

  var app = options.app;
  var website_options = options.website_options;
  var mixin_options = options.mixin_options;
  var network_client = options.network_client;

  var route = mixin_options.route;

  var cookieParser = express.cookieParser(website_options.cookie_secret);
  var sessionStore = new RedisStore(network_client.resource('cache'));

  app.use(cookieParser);
  app.use(express.session({ 
    store: sessionStore,
    secret: website_options.cookie_secret
  }))
  app.use(passport.initialize());
  app.use(passport.session({ store: sessionStore }));
  app.use(app.router);

  callback();
}

module.exports.route = function(options, callback){

  var app = options.app;
  var auth_config = options.mixin_options;
  var network_client = options.network_client;
  var website_options = options.website_options;

  var route = auth_config.route;
  
  /*
  
    only save the id of the user into the browser cookie
    
  */
  passport.serializeUser(function(user, done) {
    var cache = network_client.cache();

    cache.set('user:' + user.id, JSON.stringify(user), function(error){
      if(!error){
        done(null, user.id);
      }
      else{
        done(error);
      }
    })

  })

  /*
  
    load the full user from redis based on the cookie id
    
  */
  passport.deserializeUser(function(id, done) {
    var cache = network_client.cache();

    cache.get('user:' + id, function(error, userstring){
      if(!error){
        userstring || (userstring = '{}');
        var user = JSON.parse(userstring);

        done(null, user);
      }
    })
  })

  /*
  
    get a warehouse pointing directly to /auth
    
  */
  network_client.warehouse('/auth', function(warehouse){

    /*
    
      connect to the auth supplier and login the user

      e.g. fn

      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate(..., function(err, user) {
          if (err) { return done(err); }
          done(null, user);
        });
      }
      
    */
    function auth(name){

      return function(req, accessToken, refreshToken, profile, done){

        /*
        
          we send a POST request to the auth supplier oauth route
          
        */
        var authreq = queries.request({
          method:'post',
          path:'/oauth',
          body:{
            name:name,
            session_user:req.user,
            accessToken:accessToken,
            refreshToken:refreshToken,
            profile:profile
          }
        })

        warehouse.request(authreq, function(res){
          var answer = res.body();

          /*
          
            has the auth server confirmed a user
            
          */
          if(answer.ok){
            done(null, answer.user);
          }
          else{
            done('login error');
          }
        })

      }
    }

    /*
    
      after authentication - where should we redirect the request

      e.g. fn

      function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login'); }
        req.logIn(user, function(err) {
          if (err) { return next(err); }
          return res.redirect('/users/' + user.username);
        });
      }
      
    */
    function router(name){

      return function(){
        console.log('-------------------------------------------');
        console.log('router');
        process.exit();  
      }
      
    }

    _.each(auth_config.providers, function(providerconfig, name){
      console.log('-------------------------------------------');
      console.log('mounting: ' + name);

      providers[name].apply(null, [app, auth(name), router(name), {
        auth:auth_config,
        provider:providerconfig
      }])

    })

    app.get(auth_config.route + '/logout', function(req, res, next){
      req.session.destroy();
      req.logout();
      res.redirect('/');
    })

    callback();

  })
}