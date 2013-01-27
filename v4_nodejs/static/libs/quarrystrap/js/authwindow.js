!function ($, $quarry) {

  "use strict"; // jshint ;_;

  var _ = $quarry._;

  var AuthWindow = function (options){
    this.options = _.defaults(options, {
      container:$quarry.new()
    })
    // the user the window represents
    this.user = this.options.user;

    this.closeCallback = options.closeCallback || function(){}
    
    // we do nothing is there is no user!
    if(this.user){
      this.build();  
    }
    
  }

  var templates = $quarry.templates({

    // the list of the users logins
    main:[
  
      '<table class="table table-striped">',
      '</table>'
    ],

    authrow:[
      '<tr>',
        '<td><img src="{{provider_icon}}" border="0" /></td>',
        '<td><span class="label label-success">{{provider}} connected</span></td>',
        '<td><img src="{{account_img}}" align="absmiddle" /> {{account_name}}</td>',
      '</tr>'
    ],


    nonauthrow:[

      '<tr>',
        '<td><a href="/{{action_link}}/{{provider}}"><img src="{{provider_icon}}" border="0" /></a></td>',
        '<td><a href="/{{action_link}}/{{provider}}" class="btn btn-small btn-primary">{{action}} with {{provider}}</a></td>',
      '</tr>'

    ]
  })

  AuthWindow.prototype = {

    constructor: AuthWindow,

    build: function(){

      var $this = this.element;
      var user = this.user;
      var options = this.options;

      var self = this;

      var table = $(templates.render('main'));

      var accounts = user.accounts || {};
      var providers = $quarry.auth_providers() || [];
      var hostname = $quarry.hostname();

      var provider_row = null;
      var header = 'Login with:';
      var buttons = [];
      var closeButton = false;
      var closeCallback = null;
      var modal = 'static';

      var authCloseCallback = this.closeCallback;

      /*
        This means they have not logged in yet
       */
      if(_.keys(accounts).length<=0){
        _.each(providers, function(provider){

          var provider_icon = $quarry
            .icon('social/' + provider)
            .use('size', 48)
            .url();

          var provider_row = $(templates.render('nonauthrow', {
            hostname:hostname,
            action_link:'auth',
            provider_icon:provider_icon,
            action:'Login',
            provider:provider
          }))

          table.append(provider_row);
        })
      }
      else{
        
        header = 'Connect:';
        closeButton = true;
        modal = true;

        buttons = [{
          label:'Start using JQuarry',
          class:'btn btn-small btn-primary',
          callback:function(){
            authCloseCallback();
            return true;
          }
        }]

        _.each(providers, function(provider){

          var provider_icon = $quarry
            .icon('social/' + provider)
            .use('size', 48)
            .url();

          if(accounts[provider]){
            var account = accounts[provider];
            var provider_row = $(templates.render('authrow', {
              hostname:hostname,
              provider:provider,
              provider_icon:provider_icon,
              account_img:account.profile.img,
              account_name:account.profile.displayName
            }))

            table.append(provider_row);
          }
          else{
            var provider_row = $(templates.render('nonauthrow', {
              hostname:hostname,
              action_link:'connect',
              provider_icon:provider_icon,
              action:'Connect',
              provider:provider
            }))

            table.append(provider_row);
          }
          
        })
      }
      
      table.quarrywindow({
        header:header,
        modal:modal,
        closeButton:false,
        buttons:buttons
      })
      
    }
  }

  $.extend({
    authwindow:function(options){
      var win = new AuthWindow(options);

      return win;
    }
  })

}(window.jQuery, window.quarryio)