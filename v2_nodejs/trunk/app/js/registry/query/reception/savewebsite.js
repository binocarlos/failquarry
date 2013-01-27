/*
 * @class 		registry.query.accounts.savewebsite
 * @singleton
 * @filename   	registry/query/accounts/savewebsite.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * calls the accounts savewebsite but just returns a status
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'../accounts/savewebsite',
	
	'async',
	
	'system'
	
], function(

	_,
	
	proxyQueryFunction,
	
	async,
	
	systemClass
	
) {
	
	var run = function(broker, options, finishedCallback) {
		
		proxyQueryFunction(broker, options, function(error, website) {
			finishedCallback({
				error:error
			});
		});
		
	};
	
	return run;

});