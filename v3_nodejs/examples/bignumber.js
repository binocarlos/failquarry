var jquarry = require('../');
var handy = require('../lib/tools/handy');
var bigint = require('bigint');

var getPaddedNumber = function(num){

	num = '' + num;

	while(num.length<32){
		num += '0';
	}
}

var top = bigint(getPaddedNumber(87));
var bottom = bigint(53);

var result = top.div(bottom);

console.log(result.toString());

//var result = top.div(bottom);

//console.log(result.toString());
