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
var utils = require('../utils');
var eyes = require('eyes');
var Container = require('../container');

/*
  Quarry.io - Auth
  ----------------

  


 */

module.exports = function(options){

  return function(warehouse){

    var network_client = null;

    warehouse.on('network:assigned', function(deployment, network){

      network_client = network;

    })

    /*
    
      the users database is a connection to the system supplier holding
      the users for this stack
      
    */
    var user_warehouse = null;

    function ensure_user_warehouse(callback){
      if(user_warehouse){
        callback(null, user_warehouse);
        return;
      }

      if(!network_client){
        throw new Error('Auth server has no network client');
      }

      network_client.warehouse('/system/databases/users', function(users){
        user_warehouse = users;
        callback(null, user_warehouse);
      })
    }

    function get_user_summary(user, callback){
      var ret = {
        id:user.quarryid(),
        name:user.attr('name')
      }

      user('profile').ship(function(profiles){
        ret.profiles = profiles.map(function(profile){
          return {
            provider:profile.attr('provider'),
            name:profile.attr('displayName'),
            access:profile.meta('access')
          }
        })

        callback(null, ret);
      })

    }

    /*
    
      the OAUTH route - this compares the profile id to the user
      database to determine if this user has already been
      
    */
    warehouse.post('/oauth', function(req, res, next){

      function response_handler(user){
        if(!user){
          res.send({
            ok:false
          })
          return;
        }
        else{
          get_user_summary(user, function(error, summary){
            res.send({
              ok:true,
              user:summary
            })
          })
        }
      }

      ensure_user_warehouse(function(error, user_warehouse){

        var connection = req.body();

        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log('OAUTH REQEUST');
        eyes.inspect(connection);

        var session_user = connection.session_user;

        /*
        
          look for connections with the nameed classname and id then the user above it

          e.g:

            connection.facebook#1234
          
        */
        var selector = 'profile.' + connection.name + '#' + connection.profile.id;

        user_warehouse(selector)
          .ship(function(profiles){

            /*
            
              this means we have not seen this user yet
              
            */
            if(profiles.count()<=0){

              var profile = Container.new('profile', connection.profile);

              profile
                .meta('access', {
                  accessToken:connection.accessToken,
                  refreshToken:connection.refreshToken
                })
                .addClass(connection.name)
                .id(connection.profile.id)

              /*
              
                this is a logged in user connecting to a new provider (never seen before)
                
              */
              if(session_user){

                /*
                
                  first load the container user and then append the new profile
                  
                */
                user_warehouse('user=' + session_user.id)
                  .ship(function(user){
                    user.append(profile).ship(function(){

                      response_handler(user);
                      
                    })
                  })

              }
              /*
              
                this is a non-logged user connecting to a new provider (probably a brand new user)
                
              */
              else{

                /*
                
                  first create the new user and then append the new profile
                  
                */
                var user = Container.new('user', {
                  name:profile.attr('displayName')
                })

                user.append(profile);

                user_warehouse.append(user)
                .ship(function(newuser){

                  response_handler(newuser);
                  
                })
              }
            }
            /*
            
              we have seen this connection before - update the profile
              
            */
            else{

              /*
              
                update the profile with new access and profile data

                then save it back
                
              */
              profiles
                .attr(connection.profile)
                .meta('access', {
                  accessToken:connection.accessToken,
                  refreshToken:connection.refreshToken
                })
                .save()
                .ship(function(){

                  /*
              
                    this is a logged in user re-connecting to a known provider
                    
                  */
                  if(session_user){

                     user_warehouse('user=' + session_user.id)
                      .ship(function(user){
                        
                        response_handler(user);
                        
                      })
                  }
                  /*
                  
                    a known connection being used as a primary login from a returning user
                    if the connection exists the user exists above it it's just they have not logged in yet
                    
                  */
                  else{
                    profiles("< user").ship(function(user){
                      response_handler(user);
                    })
                  }
                })
              
            }
          })

        
      })
      
      
    })
    
  }

}