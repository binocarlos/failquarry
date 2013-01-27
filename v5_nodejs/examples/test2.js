var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');


// first setup our supply chain


var xml_supplier = io.supplier('file/xml', {
      hostname:'xml.supplier',
      file:__dirname + '/../test/fixtures/cities.xml'
    })

    io
    .warehouse({
      hostname:'root.warehouse'
    })
    .use(xml_supplier)
    .ready(function(warehouse){

      warehouse('country').ship(function(cities){

        cities('area').ship(function(areas){

          console.log('-------------------------------------------');
          console.log('-------------------------------------------');
          console.log('here');
          eyes.inspect(areas.toJSON());
        })
      })

    })