var jquarry = require('../');
var handy = require('../lib/tools/handy');

jquarry.supplier('quarrydb', {
	name:"Bobs QuarryDB",
  database: "quarrydb",
  host: "127.0.0.1",
  port:27017,
  collection:"bob2"
}).on('ready', function(warehouse){

	warehouse.find('user profile.red', function(error, container){
				console.dir(container.count());
	})
})

	/*
	jquarry('user', {
		name:'Bob',
		username:'Bobs ting',
		_children:[{
			_meta:{
				tag:'picture'
			},
			name:'Bobs Photo'
		}
		]
	}).appendTo(warehouse, function(error, bobsTing){

		
		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.log('appended 1');
		console.dir(bobsTing.raw());
		jquarry('profile', {
			name:'Facebook'
		}).addClass('red').appendTo(bobsTing, function(error, profile){
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('APPENDED 2');

			warehouse.find('user profile.red', function(error, container){
				console.dir(container.count());
			})
		})
		
	})
	
	
})
*/