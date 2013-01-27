/**
 * @class jquarry.client.rpc.accountregistry
 * @filename   	jquarry/client/rpc/accountregistry.js
 * @package    	core
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry accountregistry rpc client
 *
 */

define([

	'../rpc',
	
	'underscore',
	
	'async',
	
	'system'
	
], function(

	rpcClient,
	
	_,
	
	async,
	
	systemClass
	
) {
	
	var system = systemClass.instance();
	
	return rpcClient.extend(
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
		name: 'registry rpc client',
		
		// a cache/websiterouter to keep track of URL's we have already found
		_cache:null,
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			// we are loading the server configs because we want to know how to connect to them innit
			ret.push('server.rpc.registry');

			return ret;
			
		},
		
		/**
		 * pass the given registry query off to the server to deal with
		 * it will freeze the query to send it and unfreeze the returned object into a query
		 * the unfreezed query is then passed back
		 */
		runQuery: function(queryName, options, callback) {
			
			var client = this;
			
			system.message('flash', 'Registry Request', queryName);
			system.log(options);
			
			this._connection.runQuery(queryName, options, function(answer) {
				
				if(answer==null) {
					answer = {};
				}
				
				system.message('flash', 'Registry Answer', queryName);
				system.log(answer);
					
				callback(null, answer);	
					
    		});
		}
		
	
		
	});
	
});