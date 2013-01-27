var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');


var xml_supplier = io.supplierchain('file/xml', {
  hostname:'xml.supplier',
  file:__dirname + '/../test/fixtures/cities.xml'
})

io
.warehouse({
  hostname:'root.warehouse'
})
.use(xml_supplier)
.ready(function(warehouse){

  warehouse('city area.rich', 'country[name^=s]').ship(function(results){

    console.log('-------------------------------------------');
    eyes.inspect(results.toJSON());

    
  })
})