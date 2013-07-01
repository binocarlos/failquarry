var io = require('../');
var eyes = require('eyes');
var async = require('async');
var utils = require('../lib/utils');

var networkdata = {
	
	attr:{
		name:"My First Test Network"
	}

}

var network = io.network(networkdata);

eyes.inspect(network.root.toJSON());