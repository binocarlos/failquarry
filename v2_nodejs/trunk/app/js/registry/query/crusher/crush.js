/*
 * @class 		registry.query.crusher.crush
 * @singleton
 * @filename   	registry/query/crusher/crush.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * creates a new user
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
	

	var run = function(broker, options, finishedCallback) {
			
		var registry = broker.get('crusher');
		var module = options.module;
		var query = this;
			
		registry.crush(module, function(error) {
			
			finishedCallback(null, {
				error:error
			});
		});
			
	};
	
	return run;

});