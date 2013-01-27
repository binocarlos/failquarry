var io = require('../');
var eyes = require('eyes');
var fs = require('fs');
var async = require('async');

function runtest(callback){
		var supplier_config = {
			"driver":"ram.file",
			"directory":__dirname+'/../test/fixtures/tmp/xmlfiles',
			"path":"citieswarehouse",
			"format":"xml"
		}

		io
		.supplier(supplier_config)
		.ready(function(warehouse){

			warehouse('area', 'folder city[name^=b]')
					
				.ship(function(areas){
					console.log('-------------------------------------------');
					console.log('count: ' + areas.count());
					
					callback();
				})
		})
}

var counter = 0;

async.whilst(
	function(){
		console.log('-------------------------------------------');
		console.log('test run: ' + counter);
		return counter<10;
	},
  function(callback){
  	counter++;
  	runtest(callback);
  },
  function (err) {
      console.log('-------------------------------------------');
      console.log('done');
  }
)

