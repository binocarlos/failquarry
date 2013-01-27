var jquarry = require('../');
var async = require('async');
var handy = require('../lib/tools/handy');

console.log('-------------------------------------------');
console.log('-------------------------------------------');

async.series({
	json:function(next){
		jquarry.supplier('json', {
			name:"Bobs JSON",
			file:__dirname+'/bobsjson.json'
		}).on('ready', function(supplier){
			next(null, supplier);
		});
	},
	
	quarrydb:function(next){
		jquarry.supplier('quarrydb', {
			name:"Bobs QuarryDB",
		  database: "quarrydb",
		  host: "127.0.0.1",
		  port:27017,
		  collection:"bobnew3"
		}).on('ready', function(supplier){
			next(null, supplier);
		});
	}
}, function(error, results){

	var json = results.json;
	var quarrydb = results.quarrydb;

	json.each(':root', function(error, rootJSON){

		rootJSON.clone().pourInto(quarrydb);

	})
	
})
