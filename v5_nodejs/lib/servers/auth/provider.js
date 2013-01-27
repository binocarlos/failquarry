var _ = require('underscore');

module.exports = factory;

function factory(data){

  var user = data ? data : {};

  user.accounts || (user.accounts = {});
  user.projects || (user.projects = []);

  user.add_account = function(provider, token, profile){

    this.accounts[provider] = {
      token:token,
      profile:profile
    }
    
    return this;
  }

  user.account = function(provider){
    var account = this.accounts[provider];
    
    if(!account){
      return null;
    }

    var profile = account.profile;

    var ret = {
      name:profile.displayName
    }

    if(provider=='facebook'){
      ret.img = 'http://graph.facebook.com/' + profile.id + '/picture'
    }
    else if(provider=='twitter'){
      ret.img = profile._json.profile_image_url;
    }

    return ret;
  }

  user.raw = function(){
    return data;
  }

  return user;

}