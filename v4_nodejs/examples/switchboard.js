var io = require('../lib/quarryio');
var async = require('async');
var eyes = require('eyes');

var default_route = {
	driver:'json_file',
	pretty:true,
	file:__dirname + '/country.json'
}


// wrap the warehouse with a switchboard that emits events
// after the packet has been processed
var switchboard = io.switchboard().use(function(error, packet){
	
})

// the warehouse is something that turns routing strings into supply chains
//
// if there is no route in a packet - we silenty drop it
//
var warehouse = io.warehouse(function(route, packet, callback){

	(route && route!='root') || (route = default_route);
	
	var driver = route.driver;

	io[driver] && io[driver](route, switchboard, callback);

})



io.boot(warehouse).ready(function(warehouse){

	warehouse('city > area, .quarrydb').when(function(results){

		results.each(function(result){
			console.log(result.toString());
		})

		/*
		var db = results.find('.quarrydb').first();
		var areas = results.find('area');

		areas.pourInto(db, function(){
			console.log('-------------------------------------------');
			console.log('DONE!');
		})
		*/

	})

})