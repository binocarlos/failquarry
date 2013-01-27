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

	

	/*
	warehouse('area[population<15],fruit', '.food').when(function(results){

		var batch = io.batch();

		results.each(function(result){
			if(result.match('fruit')){

				console.log('adding batch');
				result.attr('price', 250);
				batch.add(function(next){
					result.save(next);
				})
				
			}	
		})

		
		batch.run(function(){
			console.log('SAVING HAS FINISHED!!!');
		})

	})
	*/
})