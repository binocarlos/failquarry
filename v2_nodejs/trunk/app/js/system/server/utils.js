/*
 * @class 		system.server.utils
 * @singleton
 * @filename   	system/server/utils.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * base class for database queries
 *
 *
 */

define([

	'util',
	
	'colors',
	
	'underscore'
	
], function(

	util,
	
	colors,
	
	_
	
) {
	
	var active = true;
	
	return {
		
		indent:0,
		
		messageIndent: function(inDirection) {
			this.indent += inDirection;	
			
			if(this.indent<0) { this.indent = 0; }
		},
		
		message: function(type, title, text) {
			
			if(process.env.NODE_ENV=='production') { return; }
			
			if(!active) { return; }
			
			var hr = '-------------------------------------------';
			var stars = '*******************************************';
			
			var tab =  '	';
			
			var indentTabs = '';
			
			for(var i=0; i<this.indent; i++) {
				indentTabs += tab;
			}
			
			if(_.isArray(title)) {
				title = title.join("\n");	
			}
			
			if(_.isArray(text)) {
				text = text.join("\n");	
			}
			
			if(type=='message') {
				
				util.puts(indentTabs + hr.white);
				
				util.puts(indentTabs + title.white);
			}
			else if(type=='flash') {
				
				util.puts(indentTabs + stars.magenta);
				
				util.puts(indentTabs + (title + ': ').magenta + text.white);
			}
			else if(type=='server') {
				
				var server = title;
				
				util.puts(indentTabs + stars.red);
				
				util.puts(indentTabs + 'Server Starting'.red);
				
				util.puts(indentTabs + tab + 'name: ' + ('' + server.config('name')).yellow);
				util.puts(indentTabs + tab + 'port: ' + ('' + server.config('port')).green);
				
				util.puts(indentTabs + stars.red);
			}
			else if(type=='phase') {
				
				util.puts(indentTabs + stars.green);
				
				util.puts(indentTabs + title.white);
				
				util.puts(indentTabs + stars.green);
			}
			else if(type=='setup') {
				
				util.puts(indentTabs + stars.green);
				
				util.puts(indentTabs + title.green);
				
			}
			else if(type=='complete') {
				
				util.puts(indentTabs + title.green);
				
				util.puts(indentTabs + stars.green);
			}
			else if(type=='header') {
				
				util.puts(indentTabs + hr.red);
				
				util.puts(indentTabs + title.red);
			}
			else if(type=='system') {
				
				util.puts(indentTabs + hr.grey);
				
				util.puts(indentTabs + title.cyan);
				
			}
			else if(type=='init') {
				
				util.puts(indentTabs + hr.white.bold);
				
				util.puts(indentTabs + title.white.bold);
				
			}
			else if(type=='event') {
				
				util.puts(indentTabs + tab + (title + ':').cyan + ' ' + text);
				
			}
			else if(type=='data') {
				
				util.puts(indentTabs + tab + tab + (title).grey);
				
			}
			else if(type=='subdata') {
				
				util.puts(indentTabs + tab + tab + tab + (title).grey);
				
			}
			else if(type=='subsubdata') {
				
				util.puts(indentTabs + tab + tab + tab + tab + (title).grey);
				
			}
			else if(type=='eventred') {
				
				util.puts(indentTabs + tab + (title + ':').cyan + ' ' + text.red);
				
			}
			else if(type=='eventgreen') {
				
				util.puts(indentTabs + tab + (title + ':').cyan + ' ' + text.green);
				
			}
			else if(type=='eventyellow') {
				
				util.puts(indentTabs + tab + (title + ':').cyan + ' ' + text.yellow);
				
			}
			else if(type=='data') {
				
				util.puts(indentTabs + tab + tab + title.grey);
				
			}
			
		}
		
	};
	
});