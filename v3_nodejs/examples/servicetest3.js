var jquarry = require('../');
var handy = require('../lib/tools/handy');

console.log('-------------------------------------------');
console.log('-------------------------------------------');

jquarry.supplier('filesystem', {
	name:"Bobs Filesystem",
	directory:__dirname+'/../lib'
}).on('ready', function(warehouse){

	console.dir(warehouse.raw());

	warehouse.each('file', function(error, thing){
		console.dir(thing.toString());
	})

	
})
