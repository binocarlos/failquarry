
/**
 * Module dependencies.
 */

var _ = require('underscore')
  , eyes = require('eyes')
  , quarry = require('../quarryio')
  , userFactory = require('./auth/user');

module.exports = factory;

function factory(warehouse){
  
  var auth = {
    warehouse:warehouse
  }

  auth.connect_insert = function(provider, user, account, callback){
    var user = userFactory(user);
    var account = quarry.new(account);

    user.add_account(provider, account.data('token'), account.attr('profile'));

    if(!account.data('exists')){
      // load the user and add the account if it does not exist
      this.warehouse('=' + user.id).first(function(user_container){
        
        user_container.append(account, callback);

      })  
    }
    else{
      callback();
    }
  }

  auth.ensure_provider = function(provider, token, profile, callback){
    // we try to find a user with a .twitter profile [id=]
    this.warehouse('account.' + provider + '#' + profile.id).first(function(account_container){

      // create a raw account - this will be appended to the user below
      if(account_container){
        account_container.data('exists', true);
        account_container.data('token', token);

        callback(null, account_container.raw());
      }
      else{
        var account_container = quarry.new('account', {          
          profile:profile
        })
        .id(profile.id)
        .data('token', token)
        .addClass(provider);

        callback(null, account_container.raw());
      }
      
    })
  }

  // load a user given a provider name (like facebook) and an id (like 3434343425)
  auth.ensure_user = function(provider, token, profile, callback){

    var self = this;

    // first load the user to see if it is there
    self.warehouse('account.' + provider + '#' + profile.id + ' < user').first(function(user_container){

      if(user_container){

        user_container('project').when(function(projects){

          var user = userFactory({
            id:user_container.quarryid(),
            name:user_container.attr('name'),
            current_project_index:0,
            projects:_.map(projects.children(), function(child){
              return {
                id:child.quarryid(),
                name:child.attr('name'),
                route:child.attr('route')
              }
            })
          })

          user.add_account(provider, token, profile);

          callback(null, user.raw());
        })
        
      }
      else{

        user_container = quarry.new('user', {
          name:profile.displayName
        })
       
        var account = quarry.new('account', {          
          profile:profile
        })
        .id(profile.id)
        .addClass(provider)
        .appendTo(user_container);

        var raw_project = {
          name:'hello world',
          route:{
            driver:'quarrydb',
            collection:'project_' + user_container.attr('name').replace(/\W/g, '').toLowerCase() + '_default'
          }
        }

        var project = quarry.new('project', _.extend({}, raw_project))
          .addClass('default')
          .appendTo(user_container);

        var chain = self.warehouse.supply_chain();

        self.warehouse.append(user_container, function(){

          raw_project.id = project.quarryid();
          
          var user = userFactory({
            id:user_container.quarryid(),
            name:user_container.attr('name'),
            current_project_index:0,
            projects:[raw_project]
          })

          user.add_account(provider, token, profile);

          callback(null, user.raw());
        })

      }
      
    })
  }

  return auth;
}