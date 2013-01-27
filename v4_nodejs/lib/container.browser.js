var container = require('./container');

// Global expose of the browserified container.js
(function(window) {

	var _ = container.api._;
	var async = container.api.async;

	/*
		This is injected by the server and gives us access to anything in that world we should see

	 */	
	var server_config = window._$quarry_config;

	var user = server_config.user;
	var production = server_config.production;
	var hostname = server_config.hostname;
  var permissions = server_config.permissions;
	var auth_providers = server_config.auth_providers;


	/*
		the array of ready functions to run - $quarry(function(){ ... })
	 */
	var ready_callbacks = [];

	/*
		the array of portal functions we will run when we get a push event
	 */
	var portal_callbacks = [];

	/*
		The main quarry config

			production - development or live mode
			hostname - the HTTP host - the server sets this so we can load back from source
	 */

	var config = {};

	/*
		a map of container id's that have DOM bindings in the page
		this is for automatic portal updating
	 */
	var bindings = {};

		/*
		The front end browser supply chain - proxies messages via the socket back to the server

	 */
	function supply_chain_factory(){

		// we assum the server has exposed an io object for the sockets
		var socket = io.connect('//' + hostname);

	  // we keep track of our own callbacks by id
	  var message_id = 0;
	  var rep_callbacks = {};

	  /*
			This is a result of a supply chain REQ/REP
	   */
	  socket.on('message:rep', function(message_id, packet){
	    var callback = rep_callbacks[message_id];

	    if(!callback){
	      console.log('-------------------------------------------');
	      console.log('-------------------------------------------');
	      console.log('FATAL ERROR - NO CALLBACK FOUND FOR MESSAGE: ' + message_id);
	      throw new Error('no callback found');
	    }
	    

	    callback(null, packet);
	  })

	  /*
			This is the result of a broadcast
	   */
	  socket.on('message:sub', function(packet){
	  	_.each(portal_callbacks, function(portal_callback){
	  		portal_callback(packet);
	  	})
	  })

	  var supply_chain = function(packet, callback){

	    message_id++;
	    rep_callbacks[message_id] = callback;

	    
	    socket.emit('message:req', message_id, packet);

	    return this;
	  }

	  return supply_chain;
	}

	/*
    The root supply chain - this kicks off socket.io back to the server
   */

  var supply_chain = supply_chain_factory();

  /*
    The root warehouse is a container with the root supply chain
   */

  var warehouse = container(supply_chain);
  warehouse.quarryid('root');
  warehouse.route('project.root');
  warehouse.root(permissions || {
    // here we set the permissions as given by the server render
    // it's no use trying to fool the browser by changing this
    // it is only used to display buttons and things - the command will still fail
    // if the permissions (which are not changable from here) are wrong
  })

	/*
		The global quarry object - this is exposed to the browser and accepts a ready callback jQuery style
	 */

	function $quarry(ready_callback){
		ready_callback && ready_callback(warehouse);
		return this;
	}

	$quarry.new = function(){
		var ret = container.apply(null, _.toArray(arguments));

		ret.data('new', true);

		return ret;
	}

  $quarry.supply_chain = function(){
    return supply_chain;
  }

  $quarry.silent = function(tagname){

    // make a cloned version pointing to the same supply chain
    var ret = container(supply_chain);
    ret.tagname(tagname);
    ret.data('silent', true);
    // reroute it to the top
    ret.route('/dev/null');
    
    return ret;


  }
	
	$quarry.configure = function(new_config){
		_.extend(config, new_config);
		return this;
	}

	$quarry._server_config = server_config;

	$quarry.ready = function(ready_callback){
		ready_callback && ready_callback(warehouse);
		return this;
	}

	// register a callback for any broadcasts we get
	$quarry.portal = function(portal_callback){
		portal_callbacks.push(portal_callback);
		return this;
	}

	/*
    access to the server props
   */
   
	$quarry.user = server_config.user;

	/*
    clone the warehouse and set the route to point elsewhere
    this is used to point @ system quarries
   */
  $quarry.route = function(route, permissions){
    // make a cloned version pointing to the same supply chain
    var newwarehouse = container(supply_chain);

    // reroute it to the top
    newwarehouse.route(route);
    newwarehouse.root(permissions ? permissions : true);

    return newwarehouse;
  }

  $quarry.user = function(){
  	return user;
  }

  $quarry.hostname = function(){
  	return hostname;
  }

  $quarry.production = function(){
  	return production;
  }

  $quarry.auth_providers = function(){
  	return auth_providers;
  }

  $quarry.server_config = function(){
  	return server_config;
  }

  // turn a container into a URL for it - this can be file or normal container
  $quarry.resolve = function(container){
  	var use_id = container.id() ? container.id() : container.quarryid();

  	return '//' + this.hostname() + '/quarry.io/router/' + encodeURIComponent(container.route()) + '/' + encodeURIComponent(use_id);
  }

  $quarry.url = function(path){
    if(path.match(/^(http|\/\/)/i)){
      return path;
    }
  	return '//' + this.hostname() + path;	
  }

  $quarry.cleargif = function(){
    return '//' + this.hostname() + '/quarry.io/static/clear.gif';
  }

  /*
		Remap the url to proxy via the file commands supply chain		
   */
  $quarry.file_command = function(url){
  	
  	// the array of operations we have stacked up
  	var stack = [];

  	function imgref(){}

    imgref.use = function(command, options){
      stack.push({
        name:command,
        options:options
      })
      return this;
    }

  	imgref.url = function(){
      if(stack.length<=0){
        return url;
      }
      else{
        var fileurl = encodeURIComponent(url);
        var commands = encodeURIComponent(JSON.stringify(stack));

        return $quarry.url('/quarry.io/fileproxy/' + fileurl + '/' + commands);    
      }
  	}

    return imgref;
  }

  $quarry.icon = function(container){
  	var iconurl = $quarry.iconurl(container);

  	return $quarry.file_command(iconurl);
  }

  /*
		Get the URL to an icon for this container
   */
  $quarry.iconurl = function(container){

    if(_.isString(container)){
      return $quarry.url('/quarry.io/icons/' + container + '.png'); 
    }

  	if(container.meta('icon')){
  		var icon = container.meta('icon');

  		// this is an icon name
  		if(_.isString(icon)){
  			if(icon.match(/^http/)){
  				return icon;
  			}
  			else{
  				return $quarry.url('/quarry.io/icons/' + icon + '.png');	
  			}
  		}
  		// this is a file pointer
  		else{
  			return $quarry.resolve(icon);
  		}
  	}
  	else{
  		// this means we can use the container itself for an icon pointer
  		if(container.hasClass('image')){
  			return $quarry.resolve(container);
  		}
  		else if(container.hasClass('folder')){
  			return $quarry.url('/quarry.io/icons/default/folder.png');
  		}
  		else{
  			return $quarry.url('/quarry.io/icons/default/container.png');
  		}
  	}
  }

	/*
    Expose all of the code inside of the container.api
   */
  //_.extend($quarry, container.api);

  _.each(container.api, function(obj, name){
  	$quarry[name] = obj;
  })

  window.quarryio = $quarry;
	window.$quarry = $quarry;

})(window);