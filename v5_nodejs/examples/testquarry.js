var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');


// first setup our supply chain


var quarrysupplier = io.supplier('database/quarrydb', {
  hostname:'bob.quarrydb',
  collection:'testcollection'
})

io
.warehouse({
  hostname:'root.warehouse'
})
.use(quarrysupplier.supplychain())
.ready(function(warehouse){

  warehouse('product').ship(function(results){

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    eyes.inspect(results.toJSON());

    var insert = io.new('product', {
      price:120,
      city:'Bristol'
    })

    warehouse.append(insert, function(res){
      eyes.inspect(res);
    })

    

  })
})