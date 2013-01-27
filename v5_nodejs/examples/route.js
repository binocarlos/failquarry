var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');


io
    .warehouse({
      hostname:'root.warehouse'
    })
    .use(io.supplier('ram', {
      hostname:'ram.supplier',
      data:io.new(fs.readFileSync(__dirname + '/../test/fixtures/cities.xml', 'utf8')).toJSON()
    }))
    .ready(function(warehouse){

    var warehouse_container = io.new({

    })
      .quarryid('warehouse')
      .tagname('warehouse')
      .route({
        protocol:'quarry',
        hostname:'files.quarry.io',
        resource:'test'
      })

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    eyes.inspect(warehouse_container.toJSON());
    })


