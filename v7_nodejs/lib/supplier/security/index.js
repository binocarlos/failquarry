/*

  (The MIT License)

  Copyright (C) 2005-2013 Kai Davenport

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/**
 * Module dependencies.
 */


var utils = require('../../utils')
  , eyes = require('eyes')
  , _ = require('lodash');

var Container = require('../../container');
var Warehouse = require('../../warehouse');

/*

  Quarry.io - Security Supplier
  -----------------------------

  a wrapper for a QuarryDB that runs a much reduced API
  
*/

module.exports = function(options, network){

  var warehouse = Warehouse();
  var cache = network.cache.users(options.route);
  /*
  
    create a QuarryDB supplier to save our users inside of
    
  */
  var receptionfront = network.receptionfront;
  var db = receptionfront.connect(options.user_warehouse);

  receptionfront.switchboard.debug = true;

  /*
  
    A portal to keep the Redis session cache up to date when the user saves
    
  */
  db
    .portal()
    .saved('user', function(user){
      cache.set(user.models[0], function(){
        
      })
    })

  warehouse.get('/provider/logout', function(req, res, next){
    var id = req.query.id;
    
    db('user=' + id).ship(function(user){
      user.removeAttr('active');

      user.save().ship(function(){
        res.send('ok');
      })
    })
  })

  /*
  
    provider authentication packets have the profile as returned by passport
    
  */
  warehouse.post('/provider/login', function(req, res, next){

    var packet = req.body;

    var rawprofile = packet.profile;
    var name = packet.provider;

    function injectprofile(user){
      user.attr(name, rawprofile.id);
      user.attr('active.' + name, true);

      var profiletokens = rawprofile.tokens;
      delete(rawprofile.tokens);

      var usertokens = user.attr('tokens') || {};

      usertokens[name] = profiletokens;
      user.attr('tokens', usertokens);
      
      user.attr(name + '_profile', rawprofile);

      if(!user.attr('name')){
        user.attr('name', rawprofile.name);
      }
      if(!user.attr('image')){
        user.attr('image', rawprofile.image);
      }
    }

    /*
    
      user already logged in - they are connecting
      
    */
    if(packet.user){
      db('user=' + packet.user.meta.quarryid).ship(function(user){

        if(user.empty()){
          res.error('no user for id');
          return;
        }
        
        injectprofile(user);

        user.save().ship(function(){
          res.send(user.toJSON());
        })
      })
    }
    else{

      /*
      
        user[twitter=32434]
        
      */
      db('user[' + name + '=' + rawprofile.id + ']').ship(function(user){

        /*
        
          brand new user
          
        */
        if(user.empty()){
          var user = Container.new('user')

          injectprofile(user);

          db.append(user).ship(function(){
            res.send(user.toJSON());
          })
        }
        /*
        
          existing user connecting back again
          
        */
        else{

          user.removeAttr('active');
          
          injectprofile(user);

          user.save().ship(function(){

            var returnuser = user.clone();
            //returnuser.removeAttr('tokens');

            res.send(returnuser.toJSON());
          })
        }
      })
    }

  })

  return warehouse;
}
