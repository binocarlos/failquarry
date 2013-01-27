var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');


// first setup our supply chain


var xml_supplier = io.supplier('file/xml', {
  hostname:'xml.supplier',
  file:__dirname + '/../test/fixtures/citiesout.xml'
})

io
.warehouse({
  hostname:'root.warehouse'
})
.use(xml_supplier.supplychain())
.ready(function(warehouse){

  warehouse('city[name^=b]').ship(function(results){

    results.attr('fruit', 'peaches');

    results.delete(function(){

      

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('after delete');
      

    })

  })
})