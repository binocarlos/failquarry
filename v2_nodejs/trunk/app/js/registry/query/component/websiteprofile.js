/*
 * @class 		registry.query.component.routingdecision
 * @singleton
 * @filename   	registry/query/component/routingdecision.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * get a routing decision - accepts a website request
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'async'
	
], function(

	_,
	
	async
	
) {

	/*
	 * ask the request what it wants and then use the website registry to find the decision
	 *
	 * options:
	 *	* hostname
	 *	* path
	 */
	var run = function(broker, options, finishedCallback) {
		
		var registry = broker.get('accounts');
			
		registry.getWebsiteProfile(options.id, finishedCallback);
			
	};
	
	return run;
		
});