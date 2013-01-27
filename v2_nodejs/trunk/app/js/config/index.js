/**
 * @filename   	config/index.js
 * @package    	config
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * config - wrapper for require.js'ing json config files
 *
 *
 *
 */
 
define([

	
	
], function() {
	
	var configRoot = typeof window !== "undefined" ? 'config' : 'js/config';
	
 	var convertPath = function(path) {
 		
 		path = path.replace(/\./g, '/');
		path = configRoot + '/' + path + '.json';
		
		return path;
		
 	}
 	
	var requireConfig = function(path, callback) {
		
		path = convertPath(path);
		
		require(['text!' + path], function(configText) {
			
			console.log(configText);
			
		});
		
	};
	
	return {
		require:requireConfig,
		filePath:convertPath	
		
	};
	
	
});