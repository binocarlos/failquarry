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
    file:__dirname + '/../test/fixtures/' + filename
  })

})
var defaultsupplychain = io.supplierchain('file/xml', {
  hostname:'root.quarry.io',
  file:__dirname + '/../test/fixtures/stack.xml'
})


io.router({
  hostname:'quarry.io'
})
.route('ram.quarry.io', ramprovider.supplychain())
.use(defaultsupplychain)
.ready(function(warehouse){

  warehouse('city[name^=s]', '.db').ship(function(results){
    console.log('-------------------------------------------');
    console.log('here');
    eyes.inspect(results.toJSON());
  })

})