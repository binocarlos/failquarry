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
var dye = require('dye');

var Container = require('../../../container');
var Device = require('../../../network/device');

var providers = {};

_.each(fs.readdirSync(__dirname + '/providers'), function(filename){
  var provider_name = filename.replace(/\.js$/, '');

  providers[provider_name] = require('./providers/' + provider_name);
})

/*

  quarry.io - auth middleware

  mounts routes onto a website that enable OAUTH and normal authentications
  
*/


module.exports = function(options, network){

  options || (options = {});

  var receptionfront = network.receptionfront;
  var cache = network.cache.users(options.warehouse);
  

   /*
    
    only save the id of the user into the browser cookie
    
  */
  passport.serializeUser(function(user, done) {

    cache.set(user, done);
    
  })

  /*
  
    load the full user from redis based on the cookie id
    
  */
  passport.deserializeUser(function(id, done) {

    cache.get(id, done);

  })

  function mounter(app, callback){

    /*
    
      the base route for the passport auth fn's
      
    */
    var route = options.route;
    var warehouseroute = options.warehouse;

    if(!warehouseroute){
      throw new Error('Auth middleware requires a warehouseroute route');
    }

    /*
    
      get a connection to the root warehouse
      
    */
    var db = receptionfront.connect(warehouseroute);



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
    function auth(db, name){

      /*
      
        this is the user we manifest as when we speak to the user database

        it is up to whatever database we are speaking to to configure write
        access for quarryagent.authapi
        
      */
      var authuseragent = Container.new('quarryagent').addClass('authapi').toJSON()[0];
      
      return function(req, accessToken, refreshToken, rawprofile, done){

        var provider_config = options.providers[name];
        var provider_keys = {
          key:provider_config.key,
          secret:provider_config.secret
        }

        var profile = {
          id:rawprofile.id,
          name:rawprofile.displayName,
          emails:rawprofile.emails,
          tokens:{
            user:{
              access:accessToken,
              refresh:refreshToken  
            },
            provider:provider_keys
          }
        }

        _.extend(profile, providers[name].extract.apply(providers[name], [rawprofile]));

        db
        .api({
          method:'post',
          url:'/provider/login',
          body:{
            provider:name,
            profile:profile,
            user:req.user
          },
          headers:{
            'x-quarry-department':'security'
          }
        })
        .expect('containers')
        .ship(function(user, res){
          done(res.hasError() ? res.body : null, user.get(0));
        })
      }
    }

    function router(db, name){

      return function(req, res){
        console.log('-------------------------------------------');
        console.log('router in auth index: this is where to decide to redirect after auth');
        process.exit();
      }
      
    }

    _.each(options.providers, function(providerconfig, name){
      
      providers[name].apply(null, [app, auth(db, name), router(db, name), {
        route:options.route,
        routes:options.httproutes,
        provider:providerconfig
      }])

    })

    app.get(options.route + '/logout', function(req, res, next){

      function doredirect(){
        req.session.destroy();
        req.logout();
        res.redirect('/');
      }

      if(!req.user || !req.user.meta){
        doredirect();
      }
      else{
        db
          .api({
            method:'get',
            url:'/provider/logout',
            headers:{
              'x-quarry-department':'security'
            },
            query:{
              id:req.user.meta.quarryid
            }
          })
          .ship(function(user, res){
            doredirect();
          })
      }

      
    })

    callback();
  }
  
  var middleware = {
    configure:function(app){

      app.use(passport.initialize());
      app.use(passport.session({ store: app.get('sessionStore') }));      

    },
    mount:function(app, done){
      mounter(app, done);
    }
  }

  return middleware;
}