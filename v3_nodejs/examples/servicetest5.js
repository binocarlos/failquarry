var jquarry = require('../');
var handy = require('../lib/tools/handy');

console.log('-------------------------------------------');
console.log('-------------------------------------------');

jquarry.warehouse('json', {
	name:"Bobs JSON",
	file:__dirname+'/bobsjson.json'
}).on('ready', function(warehouse){

	console.log('We have the warehouse setup');
	warehouse.each('profile', 'user .db', function(error, container){
		console.dir(container.toString());
	})

	
})
