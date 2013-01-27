var io = require('../');
var eyes = require('eyes');
var stare = eyes.inspector({maxLength:409600});
var fs = require('fs');

/*

	this code resets the state of the example each time it is run
	
*/
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

		function runquery(query) {
			warehouse(query).ship(function(container, errors){
				stare(container.toJSON(), query);
			})
		}

		runquery('folder city[name^=b]');
		runquery('folder city.south');
		runquery('folder city.south[name^=b]');
		runquery('folder city[name^=l]');
		runquery('folder city.north');
		runquery('folder city[team^=a]');
	})
	
	
})