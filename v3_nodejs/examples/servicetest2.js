var jquarry = require('../');
var handy = require('../lib/tools/handy');

console.log('-------------------------------------------');
console.log('-------------------------------------------');

jquarry.supplier('json', {
	name:"Bobs JSON",
	file:__dirname+'/bobsjson.json'
}).on('ready', function(warehouse){

	warehouse.find('user profile.red', function(error, container){
		console.dir(container.count());
	})

	/*
	console.dir(warehouse.toString());
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
*/

	/*
	warehouse.find('user, profile', function(error, container){
		console.dir(container.count());
	})
	
	console.log('-------------------------------------------');
	console.log('have warehouse');

	console.log('TEST');
	
	jquarry('user', {
		name:'Bob',
		username:'Bobs ting'
	}).appendTo(warehouse, function(error, bobsTing){

		
		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.log('appended 1');
		console.dir(bobsTing.raw());
		jquarry('profile', {
			name:'Facebook'
		}).appendTo(bobsTing, function(error, profile){
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('APPENDED 2');
		})
		
	})
*/
	
})
