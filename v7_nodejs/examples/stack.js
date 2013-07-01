var io = require('../');
var eyes = require('eyes');
var async = require('async');
var utils = require('../lib/utils');

/*

	make the stack from container data
	
*/

var stackdata = {
	
	/*
	
		the core stack configuration
		
	*/
	attr:{
		name:"My First Test Stack",
		comment:"A stack to test things out innit"
	},
	
	/*
	
		API contains all of the endpoints within the stack
		
	*/
	api:{
		attr:{
			
		},
		endpoints:[{
			"route":"/",
			"module":"io.supplier.quarrydb",
			"config":{
				"collection":"testing123"
			}
		}]
	},
	/*
	
		contains all of the websites hosted within this stack
		
	*/
	webserver:{
		attr:{
			
		},
		virtualhosts:[{
			"name":"Simples",
			"hostnames":[
				"dev.jquarry.com",
				"localhost:8080",
				"localhost"
			],
			"document_root":__dirname + '/fixtures/websites/simples/www'
		}]
	}
}

var stack = io.stack(stackdata);

eyes.inspect(stack.root.toJSON());