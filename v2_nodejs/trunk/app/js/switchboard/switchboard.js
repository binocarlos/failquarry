/*
 * @class 		switchboard
 * @singleton
 * @filename   	switchboard/switchboard.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * quarry switchboard - looks after routing messages and creating connections and portals
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'bootlace',
	
	'system',
	
	'async',
	
	'amqp',
	
	'./message',
	
	'./portal'
	
], function(

	_,
	
	bootlace,
	
	systemClass,
	
	async,
	
	amqp,
	
	messageClass,
	
	portalClass
	
) {
	
	var switchboardInstance;
	
	// the singleton bootstrap for the server system
	function bootstrapSwitchboard()
	{
		return {
			// runs once - only triggers ready the first time
	        instance: function (readyCallback) { 
	        	
	        	// we are making it the first time - this will take some time
	        	// run the readyCallback on the objects' ready (if we have one)
	        	if(switchboardInstance==null) {
	        		switchboardInstance = new theSwitchboardClass();
	        		
	        		if(readyCallback) {
	        			switchboardInstance.bind('ready', function() {
	        				readyCallback(null, switchboardInstance);
	        			});
	        		}
	        	} else if(readyCallback!=null) {
	        		readyCallback(null, switchboardInstance);
	        	}
	        	
	        	return switchboardInstance;
	        	
	        }
	    };
	}
	
	var system = systemClass.instance();
	
	var theSwitchboardClass = bootlace.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		name: 'default switchboard',
		
		// the rabbitMQ driver
		_rabbit:null,
		
		// the switchboard exchanges to publish to
		_exchanges:{},
		
		// the switchboard queues to listen to
		_queues:{},
		
		/**
		 * @constructor
		 */
		init: function(options) {
			
			this._super(options);
			
		},
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('switchboard');

			return ret;
			
		},
		
		/**
		 * setup up the registry client object
		 *
		 */
		getObjectSetupFunctions: function() {
			
			// get the base setup functions
			var ret = this._super();
			
			var switchboard = this;
			
			// load the website registry server
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				switchboard.setupRabbit(callback);
				
			});
			
			// load the website registry server
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				switchboard.setupExchange(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * setup the website registry client
		 *
		 */
		setupRabbit: function(callback) {
			
			var switchboard = this;
			
			var config = this.config('server');
			
			switchboard.message('header', 'Loading Switchboard RabbitMQ');
			switchboard.message('event', 'connect', config.host + ':' + config.port);
			
			var connection = amqp.createConnection();
			
			connection.on('ready', function() {
				
				switchboard.message('event', 'connect', 'RabbitMQ Connected');
				
				switchboard._rabbit = connection;
				
				callback();
				
			});
			
		},
		
		/**
		 * we now read the config and get a handle on the exchanges and queues the switchboard wants
		 *
		 */
		setupExchange: function(finishedCallback) {
			
			var switchboard = this;
			
			switchboard.message('header', 'Preparing Switchboard Exchange');
			
			var exchanges = this.config('exchanges');
			var queues = this.config('queues');
			
			async.forEach(exchanges, function(exchangeName, nextExchangeCallback) {
				
				switchboard.message('event', 'exchange', exchangeName);
				
				var exchange = switchboard._rabbit.exchange(exchangeName);
					
				switchboard._exchanges[exchangeName] = exchange;
					
				switchboard.message('event', 'exchange', 'open');
					
				nextExchangeCallback();
				
			}, function(error) {
			
				finishedCallback(error);				
				
			});
		},
		
		/**
		 * proxy to the system
		 */
		message: function(type, title, text) {
			
			system.message(type, title, text);
			
		},
		
		/**
		 * make a new portal from the config
		 * 		name:'Website Cache Admin Listen Portal',
		 *		exchange:'admin',
		 *		// we want all admin messages - the middleware will filter them
		 *		router:'#'
		 */
		createPortal: function(config) {
			return portalClass.factory(config);
		},
		
		/**
		 * opens the given portal onto the switchboard
		 * any messages routed to this portal will be chained through the portals middleware
		 */
		addPortal: function(portal, readyCallback) {
			
			var switchboard = this;
			
			var exchange = this._exchanges[portal.exchange()];
			
			if(!exchange) {
		 		
		 		throw new Error(exchange + ' is not a valid exchange name');
		 		
			}
			
			/*
			if(portal.name()!=null && this._portals[portal.name()]!=null) {
				
				readyCallback(this._portals[portal.name()]);
				return;
				
			}
			*/
			
			switchboard.message('event', 'portal', '  ' + portal.name());
			switchboard.message('eventred', 'exchange', portal.exchange());
			
			this._rabbit.queue(portal.name(), function(queue) {
				
				switchboard.message('eventgreen', 'status', '  open');
				
				// bind the queue to each of the given routing keys
				async.forEachSeries(portal.router(), function(route, nextRouteCallback) {
					
					switchboard.message('eventyellow', 'route', '   ' + route);
					
					queue.bind(portal.exchange(), route);
					
					nextRouteCallback();
					
				}, function() {
					
					// we have routed the queue - now provide it's messages to the portal
					queue.subscribe({ack:false}, function(rawMessage, headers, deliveryInfo) {
			 	
			 			// make a new message and send it off to the portal
			 			messageClass.factory(rawMessage, function(message) {
			 			
			 				// dispatch the message to the portal and let it's middleware do the business
			 				portal.slurpMessage(message);
			 				
			 			});
				 		
				 	});
				 	
				 	readyCallback();
			 	
				});
				
			});
		},
		
		/**
		 * sends the given message
		 */
		sendMessage: function(message, sentCallback) {
			
			switchboard.message('event', 'switchboard', 'message ' + message.id());
			
			var exchange = this._exchanges[message.exchange()];
		 	
		 	if(!exchange) {
		 		
		 		throw new Error(exchange + ' is not a valid exchange name');
		 		
		 	}
		 	
		 	exchange.publish(message.routingKey(), message.data());
			
		}
		
	});
	
	return bootstrapSwitchboard();
	
});