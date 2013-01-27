/*
 * @class quarryscript.template
 * @filename   	quarryscript/template.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * one template found in a document
 *
 */

define([

	'underscore',
	
	'async'
	
], function(

	_,
	
	async

	
) {
	
	var nextId = 0;
	
	var factory = function(data) {
		
		var prototype = {
			
		};
		
		var template = _.extend(prototype, data);
		
		template.id = template.args.id ? template.args.id : ('template' + (nextId++));
		template.replaceCode = '<replacetemplate_' + template.id + '>';
		
		return template;
	};
	
});