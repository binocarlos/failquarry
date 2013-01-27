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
var eyes = require('eyes');
var passport = require('passport')

/*

  Facebook auth strategy

  App is the express app upon which to mount the auth routes

  authfn is the function that will contact the auth supplier

  routerfn is the function that decides how to route the req after authentication

  options are the oauth settings for passport
  
*/
module.exports = function(name, version, Strategy){

  return function(app, authfn, routerfn, options){

  
    var network_client = app.network_client;

    var base_route = options.auth.route + '/' + name;

    var strategyOptions = {
      callbackURL:'http://' + options.auth.hostname + base_route + '/callback',
      passReqToCallback: true
    }

    if(version==1){
      strategyOptions.consumerKey = options.provider.key;
      strategyOptions.consumerSecret = options.provider.secret;
    }
    else if(version==2){
      strategyOptions.clientID = options.provider.key;
      strategyOptions.clientSecret = options.provider.secret;
    }

    passport.use(new Strategy(strategyOptions, authfn));

    app.get(base_route, passport.authenticate(name));

    app.get(base_route + '/callback', 
    passport.authenticate(name, { successRedirect: options.auth.success_route,
                                  failureRedirect: options.auth.failure_route }));


    /*


    function(req, res, next) {
      res.send('ok');
      //passport.authenticate(name, routerfn(req, res, next))(req, res, next);
    })
*/


  /*

    e.g. fn

    function(accessToken, refreshToken, profile, done) {
      User.findOrCreate(..., function(err, user) {
        if (err) { return done(err); }
        done(null, user);
      });
    }

   */
  }
}