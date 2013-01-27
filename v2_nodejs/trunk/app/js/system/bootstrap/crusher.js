/*
 * @filename   	jquarry/bootstrap/crusher.js
 * @package    	bootstrap
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * use require.js to crush stuff
 *
 */
 
var requirejs = require("requirejs"),
	fs = require('fs');

var workingFolder = __dirname + '/../../../../../crusher/';

requirejs([

	'./profile/server'
	
], function(profile) {
	
	var moduleName = process.argv[2];
	
	if(!moduleName) {
		console.log('no module name given');
		
		return;	
	}
	
	profile.name = moduleName;
	profile.out = workingFolder + moduleName + '.js';
	profile.preserveLicenseComments = false;
	profile.optimize = 'none';
	
	requirejs.optimize(profile, function (buildResponse) {
	    
	   	//var contents = fs.readFileSync(profile.out, 'utf8');
	    
	    // we have built it - echo the output for the requester to look after caching
	    console.log(buildResponse);
	    
	});
	
	
	
});