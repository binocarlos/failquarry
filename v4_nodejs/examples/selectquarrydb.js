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

	warehouse('product > caption, .quarrydb').when(function(results){

		var db = results.find('.quarrydb').first();
		console.log(result.toString());

		result.attr({
			price:350,
			location:'London'
		})

		console.dir(result.attr('price'));

		result.save(function(){
			console.log('saved');
		})
		

	})

})