var io = require('../lib/quarryio');
var async = require('async');
var eyes = require('eyes');

var default_route = {
	driver:'json_file',
	pretty:true,
	file:__dirname + '/country.json'
}

var warehouse = io.warehouse(function(route, callback){

	(route && route!='root') || (route = default_route);
	
	var driver = route.driver;
	
	io[driver] && io[driver](route, callback);

})

io.webserver(warehouse, {
	port:80,
	document_root:__dirname+'/web'
})
