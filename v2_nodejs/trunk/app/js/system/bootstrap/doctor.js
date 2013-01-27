/*
 * @filename   	jquarry/bootstrap/doctor.js
 * @package    	bootstrap
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * use require.js to crush stuff
 *
 */

var vm = require('vm'),
async = require('async'),
_ = require('underscore'),
fs = require('fs'),
temp = require('temp');

// the file containing the script
var patientFileName = process.argv[2];

var sandbox = {

};

with ({}) {
	require(patientFileName);
}

console.log('ok');
