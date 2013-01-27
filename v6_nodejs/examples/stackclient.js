var io = require('../');
var eyes = require('eyes');
var fs = require('fs');

io
.network('local', {
	folder:__dirname+'/networks/basic'
})
.connect(function(network){

	console.log('-------------------------------------------');
	console.log('-------------------------------------------');
	console.log('network is ready');

	network.warehouse('dev.jquarry.com', function(warehouse){

		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.log('stack is ready');
		warehouse('folder city[name^=b]').ship(function(file, errors){
			eyes.inspect(file.toJSON());
		})
				/*
		warehouse('folder#folderlink').ship(function(results){
			console.log('-------------------------------------------');
			eyes.inspect(results.toJSON());
		})


		setTimeout(function(){
			warehouse('folder city[name^=b]').ship(function(cities, errors){
				console.log('-------------------------------------------');
				console.log('-------------------------------------------');
				console.log('cities is loaded');
				eyes.inspect(cities.toJSON());
				//eyes.inspect(errors);
				
			})	
		}, 500);
		*/
		
	})

	
})