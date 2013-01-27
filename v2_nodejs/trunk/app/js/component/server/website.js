/**
 * @class jquarry.component
 * @extends base
 * @filename   	jquarry/component.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * component base class
 *
 * a component is a directory that contains some files
 * it uses a file-based element to access the file-system which means you can use quarry selectors
 * for the files inside of a component
 * 
 * 
 *
 */

define([

	'../server',
	
	'underscore',
	
	'async',
	
	'system'
	
], function(

	base,
	
	_,
	
	async,
	
	systemClass
	
) {
	
	var system = systemClass.instance();
	
	return base.extend({
		
		
		
	}, {
		
		getConfigFiles: function() {
		
			var ret = this._super();
			
			ret.push('component.server.website');
				
			return ret;
			
		},
		
		/*
		 * ensure the root directory for this component - optional do some copying
		 */
		installFiles: function(finishedCallback) {
			
			// copy the holding page upon installation
			system.copyFile(this.config('holdingPage'), this.location('index.htm'), finishedCallback);
			
		}
	});
	
});