var _ = require('underscore');

module.exports = factory;

function factory(data){

  var user = data ? data : {};

  user.accounts || (user.accounts = {});
  user.projects || (user.projects = []);

  user.parse_profile = function(provider, profile){
    var ret = _.clone(profile);

    if(provider=='facebook'){
      ret.img = 'http://graph.facebook.com/' + ret.id + '/picture'
    }
    else if(provider=='twitter'){
      ret.img = ret._json.profile_image_url;
    }

    delete(ret._json);
    delete(ret._raw);

    return ret;
  }

  user.add_account = function(provider, token, profile){

    this.accounts[provider] = {
      token:token,
      profile:this.parse_profile(provider, profile)
    }
    
    return this;
  }

  user.account = function(provider){
    var account = this.accounts[provider];
    
    if(!account){
      return null;
    }

    return account.profile;
  }

  user.raw = function(){
    return data;
  }

  return user;

}