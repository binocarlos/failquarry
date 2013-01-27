/**
 * @class 		component.server.request
 * @singleton
 * @filename   	component/server/request.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * wrapper for a robject that knows about the properties relating to a website request
 *
 * 
 *
 *
 */



define([

	'url'
	
], function(
	
	url
	
) {
	
	
	/*
	 * @static
	 * special method to accept a HTTP request and turn it into a quarry request
	 */
	var factory = function(req) {
			
		// req is a standard node HTTP request
		var requestInfo = url.parse(req.url);
		requestInfo.host = req.headers.host;
			
		return requestInfo;
	};
	
	return factory;
	
});