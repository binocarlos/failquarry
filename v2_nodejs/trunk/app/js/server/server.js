/*
 * @class jquarry.server
 * @filename   	jquarry/server/base.js
 * @package    	core
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry base level server
 *
 */

define([

	'underscore',
	
	'bootlaceportals',
	
	'async'
	
	
], function(

	_,
	
	bootlace,
	
	async
	
) {

	return bootlace.extend(
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
		name: 'default server',
		
		/**
		 * added to by subclasses
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('server');

			return ret;
			
		},
		
		/**
		 * external method for the server to run
		 * can be overriden - it is _run that actually does the business
		 */
		run: function() {
			
			if(_.isEmpty(this.config('port'))) {
			
				throw new Error("A Server needs a port to run on!");
					
			}
			
			var deamon = this.buildServer();
			
			this.message('server', this);
			
			deamon.listen(this.config('port'));
			
		},
		
		/**
		 * abstract method - this is where the server will build itself
		 */
		buildServer: function() {
			
			// return blank server with listen method 
			return {
				
				listen: function() {
					
					console.log("Abstract server, exiting...");
					
				}
				
			};
			
		}
	
		
	});
	
});