var io = require('../');
var eyes = require('eyes');
var async = require('async');
var utils = require('../lib/utils');
var SupplyChain = require('../lib/network/supplychain');

SupplyChain('system', '/database').connect(function(db){
	db('test').ship(function(){
		console.log('-------------------------------------------');
	})
})