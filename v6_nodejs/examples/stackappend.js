var io = require('../');
var eyes = require('eyes');
var fs = require('fs');

var folder = __dirname + "/localfiles";
var network_config = require('./network.json');

network_config.resources.localfiles = folder;

var livefile = folder + '/xmlfiles/cities.xml';
var backupfile = folder + '/xmlfiles/citiesbranch.xml';

var livefile2 = folder + '/xmlfiles/usacities.xml';
var backupfile2 = folder + '/xmlfiles/usacities2.xml';

var content = fs.readFileSync(backupfile, 'utf8');
fs.writeFileSync(livefile, content, 'utf8');

var content2 = fs.readFileSync(backupfile2, 'utf8');
fs.writeFileSync(livefile2, content2, 'utf8');


io
.network('development', network_config)
.stack({
	hostname:'dev.jquarry.com',
	path:__dirname+'/stack'
})
.boot(function(network){

	network.warehouse('dev.jquarry.com', function(warehouse){

		warehouse('folder city[name^=b]')
			
			.ship(function(cities){

				var area = io.new('area', {
					name:'Bishopston',
					population:387
				}).addClass('rich')

				cities.append(area).ship(function(appended){

					console.log('-------------------------------------------');
					console.log('-------------------------------------------');
					eyes.inspect(appended.toJSON());

					appended.portal(function(message){
						console.log('-------------------------------------------');
						console.log('-------------------------------------------');
						console.log('PORTAL MESSAGE');
						eyes.inspect(message);
					})

					var house = io.new('house', {
						name:'Big House',
						population:3
					}).addClass('grand')

					appended.append(house)
					.on('error', function(error){
						console.log('-------------------------------------------');
						console.log('error');
						eyes.inspect(error.toJSON());
						console.log('-------------------------------------------');
					})
					.ship(function(houses){
						console.log('-------------------------------------------');
						console.log('results');
						eyes.inspect(houses.toJSON());
					})
					
					
					
				})



				
			})
	})
	
	
})