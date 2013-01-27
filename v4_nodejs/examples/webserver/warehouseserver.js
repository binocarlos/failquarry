var io = require('../../lib/quarryio');
var async = require('async');
var eyes = require('eyes');
var server_factory = require('../../lib/clients/express');
var config = require('./config.json');

config.document_root = __dirname + '/www';

var server = io.webserver(config);

var app = server.express;

server.start();


 /*
    A map of special id's that if their own in the context will trigger

    so

    $('blueprint', '#blueprints')

    means trigger the special blueprints (i.e. system ones)
   */
  var special_routes = {
    'quarry.blueprints':{
      driver:'json_file',
      pretty:true,
      file:__dirname + '/blueprints.json'
    }
  }

  /*
   *
   * Warehouse Supply Chain
   *
   */
  var warehouse = quarry.warehouse(function(route, packet, callback){

    // we must have a login for them to get access to a warehouse
    if(!packet.user){
      // send back an empty supply chain
      callback('no user present');
      return;
    }

    // this is the special router so we can ask the system about stuff
    // this can NEVER be written to here ('because it's only for select messages)
    if(special_routes[route]){

      console.log('GETTING SPECIAL ROUTE!!!');
      route = special_routes[route];

    }
    else{

      // load the project from the session - this will tell us the route
      var user = packet.user;

      var current_project = user.projects[user.current_project_index];

      var default_route = current_project ? current_project.route : null;

      // the project should tell us a route but this is the uber-default
      if(!default_route){
        default_route = {
          driver:'quarrydb',
          collection:'root_' + packet.user.id
        }
      }

      route = route ? (route!='root' ? route : default_route) : default_route;
    }
      
    var driver = route.driver;
      
    quarry[driver] && quarry[driver](route, callback);  
  })