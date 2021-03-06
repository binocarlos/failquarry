var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');


var filesystem = io.provider({
  hostname:'disk.quarry.io'
}).produce(function(directory){

  return io.supplierchain('file/' + ext, {
    hostname:'ram.quarry.io',
    resource:directory,
    file:__dirname + '/filesystem/' + directory
  })

})

var quarrydbprovider = io.provider({
  hostname:'quarrydb.quarry.io'
}).produce(function(collection){

  return io.supplierchain('database/quarrydb', {
    hostname:'quarrydb.quarry.io',
    resource:collection,
    collection:collection
  })

})

var defaultsupplychain = io.supplierchain('file/xml', {
  hostname:'root.quarry.io',
  file:__dirname + '/stack.xml'
})


io.router({
  hostname:'quarry.io'
})
.route('ram.quarry.io', ramprovider.supplychain())
.route('quarrydb.quarry.io', quarrydbprovider.supplychain())
.on('message', function(message){
  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  console.log('wohaaa');
})
.use(defaultsupplychain)
.ready(function(warehouse){

  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  console.log('have warehouse');

  warehouse('city', '.db').ship(function(cities){
    cities.each(function(city){
      console.log('-------------------------------------------');
      eyes.inspect(city.toJSON());
    })
  })

  

})