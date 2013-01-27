var io = require('../');
var eyes = require('eyes');
var fs = require('fs');

var folder = __dirname + "/localfiles";
var network_config = require('./network.json');

network_config.resources.localfiles = folder;

var livefile = folder + '/xmlfiles/cities.xml';
var backupfile = folder + '/xmlfiles/citiesbranch.xml';

var content = fs.readFileSync(backupfile, 'utf8');
fs.writeFileSync(livefile, content, 'utf8');

io
.network('development', network_config)
.stack({
	hostname:'dev.jquarry.com',
	path:__dirname+'/stack',
	
})
.boot(function(network){

	console.log('-------------------------------------------');
	console.log('-------------------------------------------');
	console.log('network is ready');

	network.warehouse('dev.jquarry.com', function(warehouse){

		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.log('stack is ready');

		warehouse('folder#quarrylink food').ship(function(food){

			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('loaded food');
			
			food.delete().ship(function(messages){
				console.log('-------------------------------------------');
				console.log('food deleted');
				eyes.inspect(messages);
			})
			
		})
	})
	
	
})