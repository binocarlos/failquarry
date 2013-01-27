var containerFactory = require('../lib/container'),
    quarrydbSupplier = require('../lib/supplier/quarrydb'),
    jquarry = require('../'),
		handy = require('../lib/tools/handy');



jquarry.warehouse({
  file:__dirname + '/../test/fixtures/warehouse.json',
}).on('ready', function(error, warehouse){

  warehouse.find('product.onsale[price<100]', function(error, results){

  	console.log('st results');
  	warehouse.close();
  	/*
  	console.dir(warehouse.find.toString());
    var quarrySupplier = results.at(0);

    quarrySupplier.find('product.onsale[price<100] > image.big', function(imageContainer){

    })
    */
    
    
  })

  
});
