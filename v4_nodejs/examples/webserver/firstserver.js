var io = require('../../lib/quarryio');
var async = require('async');
var eyes = require('eyes');
var config = require('./config.json');
var express = require('express');
var redis = require("redis");
var redisclient = redis.createClient(config.redis_port, config.redis_host);

config.document_root = __dirname + '/www';

/*
  Routes to system resources
 */
var special_routes = {

  /*
    The system blueprints - give them a choice of juicy stuff to add
   */
  'system.blueprints':{
    driver:'json_file',
    pretty:true,
    file:__dirname + '/blueprints.json'
  },
  
  /*
    System icons - a folder full of icon images
   */
  'system.icons':{
    driver:'filesystem',
    directory:io.document_root + '/../static/icons'
  }
}

/*
  Routes for auto-generated project resources
 */
var project_routes = {
  'default':'root',
  'project.root':'root',
  'project.blueprints':'blueprints',
  'project.files':'files'
}

/*
  Routes to default project resources

  Each project gets:

    project.root
    ------------
    the root supply chain that holds this project

    project.blueprints
    ------------------
    a seperate database to add blueprints to

    project.files
    -------------
    a seperate filesystem to upload files to
 */

function get_project_route(user, route){

  // this means it is not for the project
  if(!project_routes[route]){
    return null;
  }

  var route_type = project_routes[route];

  var current_project = user.projects[user.current_project_index];

  current_project || (current_project = {
    route:{
      driver:'quarrydb',
      collection:'defaultproject_' + packet.user.id
    }
  })

  var project_collection = current_project.route.collection;

  /*
    We are after the top level project resource
   */
  if(route_type=='root'){
    // just return the prescribed route for the project
    return current_project.route;
  }
  /*
    We want the user-blueprints list
   */
  else if(route_type=='blueprints'){
    // use the collection name to make a blueprints collection
    return {
      driver:'quarrydb',
      collection:project_collection + '_blueprints'
    }
  }
  /*
    The user files repo
   */
  else if(route_type=='files'){
    // use the collection name to point to a auto-making filesystem
    return {
      driver:'filesystem',
      autogen:true,
      directory:__dirname + '/userfiles/' + project_collection
    }
  }


}

/*
  We keep our supply chains open for speed
 */
var routing_cache = {};

/*
  Warehouse - the supply chain that can switch suppliers based on the route
 */
var warehouse = io.warehouse(function(routing_key, packet, callback){

  // we must have a login for them to get access to a warehouse
  if(!packet.user){
    // send back an empty supply chain
    throw new Error('security error - the warehouse only accepts strings')
    return;
  }

  var user = packet.user;

  if(!routing_key || routing_key=='' || routing_key=='undefined'){
    routing_key = 'default';
  }

  // this means we already have a complex route
  if(!_.isString(routing_key)){
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    eyes.inspect(routing_key);
    throw new Error('security error - the warehouse only accepts strings')

  }



  // work out what permissions apply to the supply chain that we find
  function get_route_permissions(route){

    // this is the default special drives owned by the user
    if(project_routes[routing_key]){

      // they can write to these because they belong to them!
      return {
        write:true,
        read:true
      }
    }
    // these are the system ones read only
    else if(special_routes[routing_key]){

      // they can only read from the special ones (unless it's a major - yes sir)
      return {
        read:true,
        write:user.rank=='major' ? true : false
      }
    }
    // these are saved routes - look at the user_id for writing
    else{

      var permissions = route.permissions || {};

      // this asks the route permissions for public read
      // it only allows the owner to write
      return {
        read:permissions.public,
        write:route.user_id==user.id
      }
    }
  }

  // use the user id in the cache otherwise the defaults get merged
  var cache_key = user.id + '_' + routing_key;

  // once we have our routing object this is what builds and returns the supply chain
  // it returns the routing key also so the warehouse can inject it into the results
  function found_route(route){
    var driver = route.driver;
    io[driver] && io[driver](route, function(error, routed_supply_chain){
      routing_cache[cache_key] = routed_supply_chain;

      callback(error, routed_supply_chain, routing_key, get_route_permissions(route));
    })
  }

  // we already have this route cached and ready to go
  if(routing_cache[cache_key]){
    var cached_supply_chain = routing_cache[cache_key];

    callback(null, cached_supply_chain, routing_key, get_route_permissions(cached_supply_chain));
    return;
  }

  // lets see if this route is for a special project resource (like blueprints or files)
  var project_route = get_project_route(packet.user, routing_key);

  // this is the 'root' container for the user
  if(project_route){
    found_route(project_route);
  }
  // this is the special router so we can ask the system about stuff
  // this can NEVER be written to here ('because it's only for select messages)
  else if(special_routes[routing_key]){

    found_route(special_routes[routing_key]);

  }
  // this means the route has been saved into redis
  else{
    redisclient.get('route_' + routing_key, function (err, reply) {
      if(err){
        throw new Error(err);
      }

      if(!reply){
        throw new Error('error routing key given but not found in redis: ' + routing_key);
      }

      var route = JSON.parse(reply);

      found_route(route);
    })
  }
})

/*
  Switchboard - this wraps the warehouse and broadcasts events as it sees them
  It also hooks into the pub/sub to get events from other servers
 */

var switchboard = io.switchboard(warehouse);

/*
  the users database
  this is a quarrydb
  it is kept seperate from the other databases
 */
var userdb = io.supplier(io.quarrydb({
  collection:'testusers'
}))

/*
  The config for the web server
 */
var server_settings = {
  hostname:'dev2.jquarry.com',
  document_root:__dirname + '/www'
}

/*
  The API keys of the providers we want to allow a login for
 */
var auth_settings = {
  "facebook":{
      "clientID":"235139659919776",
      "clientSecret":"560bdc68d3d03020c709785ec0381a54"
    },
    "twitter":{
      "consumerKey":"mienJfG4zeERhg8zZIvvg",
      "consumerSecret":"5z4E48dOVUWv6IuuWwOdsdyew9yuD2XLNsTZG1UcYw"
    }
}

/*
  Make a new express server
  You give a document root - it looks after delivering socket.io
 */
var server = io.webserver(server_settings);

/*
  Before we build the express server we want to give it some authentication settings
  We provide it with a Quarry DB as it's user database
  The user database can be any supply chain that saves    
*/
server.auth(auth_settings, userdb);

/*
  Now we build the server - it produces a stack which has express, socketio and the raw http server
  we can now add our main data warehouse via 'use'
  then we can 'listen' and we are up!
*/
server.build(function(stack){
  
  var app = stack.app;
  var http = stack.http;
  var sockets = stack.sockets;

  /*
    We can now do anything an express application can do
   */
  app.get('/', function(req, res){
    res.send('user = ' + JSON.stringify(req.user, null, 4));
  })
  
  /*
    the stack is ready for a warehouse
    this will get all messages coming down the socket
    it needs to route those messages to the correct supply chains
   */
  stack

    // pass the warehouse wrapped in the switchboard
    .supply_chain(switchboard)

    // pass the switchboard for events
    .switchboard(switchboard)

    // setup the digger application
    .application(app, {
      name:'digger',
      route:'/digger',
      title:'Digger',
    })
    
    // finally trigger a listen and we are live
    .listen(function(){
      console.log('all listening');
    });
})