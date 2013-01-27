var io = require('../');
var eyes = require('eyes');
var fs = require('fs');

var folder = __dirname + "/localfiles/xmlfiles";

var livefile = folder + '/cities.xml';
var backupfile = folder + '/citiesnobranch.xml';

var content = fs.readFileSync(backupfile, 'utf8');
fs.writeFileSync(livefile, content, 'utf8');


io
.supplier({
	"driver":"ram.file",
	"directory":folder,
	"path":"cities",
	"format":"xml"
})
.ready(function(warehouse){

	warehouse('folder city[name^=b]')
			
		.ship(function(cities){

			var area = io.new('area', {
				name:'Bishopston',
				population:387
			}).addClass('rich')

			cities.append(area).ship(function(appended){

				appended.portal(function(){
					console.log('-------------------------------------------');
					console.log('-------------------------------------------');
					console.log('PORTAL MESSAGE');
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