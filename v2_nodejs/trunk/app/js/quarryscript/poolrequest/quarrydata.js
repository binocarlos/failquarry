/*
 * @class 		quarryscript.poolrequest.quarrydata
 * @filename   	quarryscript/poolrequest/quarrydata.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * issue a quarry selector and get the results
 *
 * 
 *
 *
 */

define([

	'underscore',
	
	'../poolrequest',

	'async',
	
	'robject',
	
	'system',
	
	'quarry/warehouse'
	
], function(

	_,
	
	base,
	
	async,
	
	robject,
	
	systemClass,
	
	warehouseClass
	
) {
	
	var system = systemClass.instance();
	var warehouse = warehouseClass.instance();
	
	var run = function(options, finishedCallback) {
		
		var selector = options.selector;
		var context = options.context;
		var document = options.document;
		
		// tell the warehouse to do its thing on the contract
		warehouse.fulfillContract({
			selector:selector,
			context:context,
			drives:document.profile.drives
		}, function(error, container) {
			
			if(error) {
				finishedCallback(error);
				return;
			}
			
			console.log('have container');
				
		});

	};
	
	return run;

});