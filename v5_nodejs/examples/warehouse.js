var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');

var xmlsupplier = io.supplier('file/xml', {
	hostname:'xml.supplier',
	path:__dirname + '/../test/fixtures/cities.xml'
})

io
.warehouse({
	hostname:'root.warehouse'
})
.use(xmlsupplier)
.ready(function(warehouse){

  warehouse('> *:tree').ship(function(results){

  	console.log('-------------------------------------------');
  	console.log('here are results');
  	eyes.inspect(results.toXML());
    
  })
})
  