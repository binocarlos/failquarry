var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');

var xml_supplier = io.supplier('file/xml', {
  hostname:'xml.supplier',
  file:__dirname + '/../test/fixtures/cities.xml'
})

io
.warehouse({
  hostname:'root.warehouse'
})
.use(xml_supplier.supplychain())
.ready(function(warehouse){

  warehouse('country').ship(function(countries){

    var city = warehouse.new('city', {
      name:'Dundee',
      team:'Cake'
    })
    .addClass('north')

    var area = warehouse.new('area', {
      name:'Parkdown',
      population:120
    })
    .addClass('poor')

    city.append(area);

    countries.append(city, true).ship(function(append_results){
      console.log('-------------------------------------------');
      console.log('after append');
      eyes.inspect(append_results);
      
    })

  })

})
