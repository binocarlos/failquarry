/*
 * @filename   	stumble-fs/index.js
 * @package    	stumble-fs
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * Stumble FS - cascading filesystem with caching
 *
 * You give it an array of directories as a search path and then when you ask it for a file it 
 * will stumble through those directories and find the first file that actually exists
 *
 * If we had folders like this:
 *
 * 	* /home/somewhere/lookfirst
 * 		* page.htm
 * 
 * 	* /home/somewhere/thenlookhere
 * 		* page.htm
 * 		* image.jpg
 *
 * 	* /home/somewhere/finally
 * 		* page.htm
 * 		* page2.htm
 * 		* image.jpg
 *
 * Then we would make a new stumble like this:
 *
 *	var stumble = require('stumble-fs')([
 *		'/home/somewhere/lookfirst',
 *		'/home/somewhere/thenlookhere',
 *		'/home/somewhere/finally'
 *	]);
 *
 * And then we could ask the stumble for files:
 *
 *	// imagePath would become '/home/somewhere/thenlookhere/image.jpg'
 * 	var imagePath = stumble.path('image.jpg');
 *
 *	// page would become '/home/somewhere/lookfirst/page.htm'
 * 	var page = stumble.path('page.htm');
 *
 *	// page2 would become '/home/somewhere/finally/page2.htm'
 * 	var page2 = stumble.path('page2.htm');
 * 
 * Stumble looks after caching paths so we are not constantly calling fs.stat
 *
 * It also looks after clearing the path cache when anything changes in those directories (using fs.watchFile)
 * 
 * Module is coded with amdefine so will work in node.js without require.js
 *
 */
 
 if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
	
	var stumble = function(paths) {
		
		this.paths = paths;
		
		this.find = function(path) {
			
			console.log('trying to find: ' + path);
			
		};
		
	};
	
	return stumble;
	
});