var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');


var ramprovider = io.provider({
  hostname:'ram.quarry.io'
}).produce(function(filename){

  var ext = filename.match(/\.(\w+)$/)[1]

  return io.supplierchain('file/' + ext, {
    hostname:'ram.quarry.io',
    resource:filename,
    file:__dirname + '/ram/' + filename
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
  warehouse('.db').ship(function(dbs){
    dbs.find('#citiesxml').select('city:tree').ship(function(cities){

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');

      dbs.find('#quarrydb').append(cities, function(){
        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log('append is done');
      })
      
    })
  })

  

})