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

		warehouse('folder city[name^=b]').ship(function(cities, errors){
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('cities is loaded');
			eyes.inspect(cities.toJSON());

			var area = io.new('area', {
				name:'Brislington',
				flavour:'apple'
			})

			cities.portal(function(message){
				console.log('-------------------------------------------');
				console.log('-------------------------------------------');
				console.log('portal!!!');
				eyes.inspect(message);
			})

			cities.append(area).ship(function(){
				console.log('-------------------------------------------');
				console.log('cities appended');
			})
			//eyes.inspect(errors);
			
		})
	})

	
})