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