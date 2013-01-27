/*!
 * jQuarry client - this is browserified and required by api.js
 * it expects to be run in the browser alongside jquery
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var containerFactory = require('./container'),
    contractFactory = require('./legal/contract'),
    _ = require('underscore');

$(function(){

	// have we connected to the socket yet
	var isConnected = false;

	// the id to keep track of RPC
	var requestId = 0;
	var requestCallbacks = {};

  var socket = io.connect();

	var readyCallbacks = window.$quarry ? window.$quarry._callbacks() : [];

	var runReady = function($quarry){
		
		window.$quarry = $quarry;

		_.each(readyCallbacks, function(readyCallback){
			readyCallback();
		});
		
	}

	/**
	 * The front door entry point that is just a proxy to create a new container
	 *
	 * @api public
	 */

	var rootContainer = containerFactory('quarry', {
		name:'Client Quarry'
	})

	// wrap up a request with an id so we know what callback
	// to trigger when the answer from the socket arrives
	// (we might have several of these)
	var rpcRequest = function(route, req, callback){
		req.route = route;
		req.id = requestId++;
		
		requestCallbacks[req.id] = callback;
		socket.emit('rpc:request', req);
	}

	// wrap up an answer from the server
	socket.on('rpc:response', function(res){
		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.log(res);
		var callback = requestCallbacks[res.id];
		callback && callback(res);
		delete(requestCallbacks[res.id]);
	});

	// process the results back from the find
	var hookupFindResults = function(results, readyCallback){
		var resultsContainer = containerFactory(results);

		resultsContainer.recurse(function(descendent){

			// hook up the remote searching for descendents
			if(descendent.data('remote_find')){
				descendent.use('find', function(query, next){
					executeContainerSearch(query, descendent, next);
					next();
				})
			}

			descendent.use('save', function(next){
				next();
			})

			descendent.use('append', function(child, next){
				console.log('APPEND INNIT');

				rpcRequest('append', {
					child:child.raw(),
					parent:descendent.raw()
				}, function(res){

					console.log('APPEND RESULT!');
					console.log(res);
				})
			})
		})

		return resultsContainer;
	}

	// run a search within the given container
	var executeContainerSearch = function(query, contextContainer, searchCallback){
		var selector = query.selector().toString();
		var context = contextContainer ? '=' + contextContainer.quarryid() : query.context().toString();
		rpcRequest('find', {
			selector:selector,
			context:context,
			supplier_type:contextContainer ? contextContainer.data('supplier_type') : null,
			supplier_config:contextContainer ? contextContainer.data('supplier_config') : null
		}, function(res){

			var resultsContainer = hookupFindResults({
				name:"Search Results",
				selector:selector,
				context:context,
				_children:res.data
			});
			
			searchCallback(null, resultsContainer);
		})
	}



	// the main find method on the root container
	rootContainer.use('find', function(query, next){

		executeContainerSearch(query, null, next);

	})

	// return a new container with the given data
	var runConstructor = function(type, attr){
		return containerFactory(type, attr);
	}

	// a selector action - run find on the root container
	var runSelector = function(selector, context){

		var ret = {
			ship:function(callback){
				rootContainer.find(selector, context, function(error, results){
					callback && callback(results);
				});
			},
			first:function(callback){
				rootContainer.find(selector, context, function(error, results){
					callback && callback(results.at(0));
				});
			},
			each:function(callback){
				rootContainer.find(selector, context, function(error, results){
					callback && results.each(function(error, result){
						callback(result);
					});
				});
			}
		}

		return ret;
	}

	// the main entry function
	function jQuarry(selector, context){

		var self = this;
		if(_.isFunction(selector)){
			readyFunctions.push(selector);
			return;
		}
		// this is a constructor
		else if(_.isObject(selector)){
			return runConstructor(selector, context);
		}
		else if(_.isString(selector) && _.isObject(context)){
			return runConstructor(selector, context);
		}
		// this is a selector
		else {
			return runSelector(selector, context);
		}
	}

  // connect to the socket
  socket.on('connect', function() {
  	
  	if(isConnected){
    	return;
    }
    isConnected = true;

    console.log('connected socket!');

    runReady(jQuarry);


  })  

})