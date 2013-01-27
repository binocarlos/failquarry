var express = require('express'),
    cabinet = require('cabinet'),
    eyes = require('eyes'),
    fileproxy = require('../fileproxy'),
    _ = require('underscore');


var static_folder = __dirname + '/../../../static';
/*
  The core API routes for serving the container.browser.js and socket.io
 */
module.exports.quarry = function(stack) {
  
  var app = stack.app;

  /*
    Expands into:

      /socket.io/socket.io.js (dealt with by socket.io)

      /quarry.io.container.js (below)
   */

  app.get('/quarry.io.js', function(req, res){
    res.type('application/javascript');

    res.render('boot', {
      hostname:req.host,
      user:req.user,

      // this needs to be updated when we get some links in other starting points
      // at the moment this means the default user project and it assumes they are logged in
      //
      // these permissions used by container.browser to bootstrap the warehouse used on the page
      permissions:{
        read:true,
        write:true
      },
      production:process.env.NODE_ENV=='production',
      auth_providers:_.keys(app.options.auth || {})
    })
  })

  /*
    the browserified version of the container.browser
   */
  app.get('/quarry.io.container.js', function(req, res){
    var document_root = __dirname + '/../../'

    res.sendfile('container.browser.built.js', {
      root:document_root
    })
  })

  app.use('/quarry.io/router', function(req, res){

    var path = req.path.replace(/^\/quarry\.io\/router/);
    var parts = path.split('/');

    var route = decodeURIComponent(parts[1]);
    var id = decodeURIComponent(parts[2]);

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    eyes.inspect(route);
    eyes.inspect(id);

    if(stack.supply_chain){
      stack.supply_chain({
        action:'serve',
        user:req.user,
        route:route,
        message:{
          id:id
        }
      }, function(error, answer_packet){

        var resource_route = answer_packet.answer || {};
        
        if(resource_route.type=='local'){
          res.sendfile(resource_route.file, {
            root:resource_route.document_root
          })
        }
        else{
          console.log('-------------------------------------------');
          console.log('file route not supported yet: ' + resource_route.type);
          res.send(404);
        }

      })
    }
    else{
      res.send(404);
    }
  })

  /*
    Load a file and mess with it in the local cache
   */
  app.use('/quarry.io/fileproxy', fileproxy({
    base_url:'/quarry.io/fileproxy'
  }))

  /*
    The default icon handler
   */
  app.use('/quarry.io/icons', function(req, res){

    var icon = req.path.replace(/^\/quarry\.io\/icons/);

    if(!icon.match(/\.\w{3}$/)){
      icon += '.png';
    }

    var document_root = static_folder + '/icons'
    
    res.sendfile(icon, {
      root:document_root
    })
  })

  /*
    the various static files
   */

  var static_root = static_folder;

  app.use('/quarry.io/static', cabinet(static_root, {
    gzip:true,
    // Set LESS CSS options
    less:{
      // Specify search paths for @import directives
      paths: ['.',static_root + '/libs'], 
    },
    // Activates in-memory cache
    cache:{ 
      maxSize: 1024, 
      maxObjects:256
    }
  }))

 


//    res.sendfile(file);
}

/*
  Renders a Twitter Bootstrap page wrapper based on the given config

  acts as middleware
 */
module.exports.application = function(app, options){

  options || (options = {})

  _.defaults(options, {
    name:'digger',
    title:'Digger',
    route:'/digger',
    production:process.env.NODE_ENV=='production'
  })

  app.get(options.route, function(req, res){

    var params = _.clone(options);
    params.hostname = req.host;
    params.user = req.user;

    req.session.approute = options.route;
    req.session.save();

    res.render('applications/' + options.name, params);
  })

}