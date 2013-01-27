/*
 * @class switchboard.portal
 * @extends base
 * @filename   	switchboard/portal.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * portal
 * 
 * 
 *
 */

define([

	'base',
	
	'underscore',
	
	'async'
	
	
], function(

	base,
	
	_,
	
	async
	
) {
	
	// here is where we have special components that live elsewhere
	var typeShortcuts = {
		
		
		
	};
	
	return base.extend({
		
		/*
		 * the base message factory
		 *
		 */
		factory: function(config, readyCallback) {
			
			// the portal is ready right away
			return new this.prototype.constructor(config);
			
		}
		
	}, {
		
		/*
		 * the name of the portal (this will show up as the queue name in the rabbit admin panel)
		 */
		_name: null,
		
		/*
		 * the exchange the portal is connected to
		 */
		_exchange: null,
		
		/*
		 * the list of middleware that will get each message seen through this portal
		 */
		_middleware: [],
		
		/*
		 * the routing keys we will bind the queue to the exchange with
		 */
		_router: null,
		
		/*
		 * used by the switchboard to see if the factory is needed
		 */
		_isPortal:true,
		
		init: function(config) {
			
			this._name = config.name;
			this._exchange = config.exchange;
			this._router = config.router || [];
			
			// turn the router into a list of routing keys if its not
			if(!_.isArray(this._router)) {
				this._router = [this._router];
			}
				
		},
		
		/**
		 * slurp in the message and async it through the middleware
		 * any middle can choose not to call next and the chain ends
		 * it is up to the user of a portal what middleware to chain how
		 */
		slurpMessage: function(message) {
			
			async.forEachSeries(this._middleware, function(middleware, next) {
				
				// dispatch the message to the middleware
				middleware(message, next);
				
			}, function(error) {
				
				// we have slurped the message
			});
		},
		
		/**
		 * add some middleware to the portal
		 */
		use: function(middleware) {
			
			this._middleware.push(middleware);
			
		},
		
		
		name: function() {
			return this._name;
		},
		
		exchange: function() {
			return this._exchange;
		},
		
		router: function() {
			return this._router;
		}
		
	});
	
});