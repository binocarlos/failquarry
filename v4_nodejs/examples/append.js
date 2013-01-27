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
	}).addClass('onsale');

	warehouse('fruit.citrus, area', '.food').when(function(results){

		var batch = io.batch();

		results.each(function(result){
			
			batch.add(function(next){
				result.append(test, next);
			})

		})

		
		batch.run(function(){
			console.log('Appending HAS FINISHED!!!');
		})

	})

})