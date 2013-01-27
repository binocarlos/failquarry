/*
 * @class switchboard.message.filesystem
 * @extends base
 * @filename   	switchboard/message/filesystem.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * message about the filesystem
 * 
 * 
 *
 */

define([

	'../message',
	
	'underscore',
	
	'async'
	
	
	
	
], function(

	baseClass,
	
	_,
	
	async
	
) {
	
	return baseClass.extend({
		
		
		
	}, {
		
		exchange: function() {
			return 'admin';
		},
		
		routingKey: function() {
			return 'filesystem';
		},
		
		filepath: function() {
			return this.get('filepath');	
		}
		
	});
	
});