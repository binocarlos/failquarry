var io = require('../');
var eyes = require('eyes');
var fs = require('fs');

var folder = __dirname + '/../test/fixtures/tmp/xmlfiles';
var livefile = folder + '/cities.xml';
var backupfile = folder + '/cities2.xml';

var content = fs.readFileSync(backupfile, 'utf8');
fs.writeFileSync(livefile, content, 'utf8');

var supplier_config = {
	"driver":"ram.file",
	"directory":folder,
	"path":"cities",
	"format":"xml"
}

io
.supplier(supplier_config)
.ready(function(warehouse){

	warehouse('area', 'folder city[name^=b]')
			
		.ship(function(areas){
			console.log('-------------------------------------------');
			console.log(areas.count());
		})
})