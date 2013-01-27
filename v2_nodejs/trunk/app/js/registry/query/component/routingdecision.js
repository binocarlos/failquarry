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
	
	'async',
	
	'component/server/routingdecision'
	
], function(

	_,
	
	async,
	
	routingDecision
	
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
		var request = options.request;
			
		registry.findWebsite(request.host, function(error, website) {
			
			// we do not have a website - redirect them home
			if(!website) {
				finishedCallback(null, {});
				return;
			}
		
			// we have a website - ask it for a decision
			website.getRoutingDecision(request, function(error, decision) {
				finishedCallback(null, decision);
			});
				
		});
			
	};
	
	return run;
		
});