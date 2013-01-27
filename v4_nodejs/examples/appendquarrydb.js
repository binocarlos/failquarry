var io = require('../lib/quarryio');
var async = require('async');
var eyes = require('eyes');

var default_route = {
	driver:'json_file',
	pretty:true,
	file:__dirname + '/country.json'
}

// the warehouse is something that turns routing strings into supply chains
//
// if there is no route in a packet - we silenty drop it
//
io.boot(io.warehouse(function(route, callback){

	(route && route!='root') || (route = default_route);
	
	var driver = route.driver;
	
	io[driver] && io[driver](route, callback);

})).ready(function(warehouse){

	var test = io.new('product', {
		price:200,
		tagline:'A real cheap eat'
	})
	.addClass('onsale')
	.append(io.new('caption', {
		text:'hello world'
	}))

	warehouse('.quarrydb').each(function(quarrydb){

		console.dir(quarrydb.toString());
		quarrydb.append(test, function(){
			console.log('-------------------------------------------');
			console.log('done');
		})
		

	})

})