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

var fileprovider = io.provider({
  hostname:'files.quarry.io'
}).produce(function(folder){

  return io.supplierchain('filesystem/local', {
    hostname:'files.quarry.io',
    resource:folder,
    path:__dirname + '/filesystem/' + folder
  })

})

var apikeys = {
  'flickr':'44c3c3c80c7753619d52e912b90aacbe'
}

var apiprovider = io.provider({
  hostname:'api.quarry.io'
}).produce(function(api){

  return io.supplierchain('api/' + api, {
    hostname:'api.quarry.io',
    resource:api,
    apikey:apikeys[api]
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
.route('files.quarry.io', fileprovider.supplychain())
.route('api.quarry.io', apiprovider.supplychain())
.use(defaultsupplychain)
.ready(function(warehouse){

  warehouse('city', '#citiesxml').ship(function(results){
    console.log('-------------------------------------------');
    console.log('here');
    eyes.inspect(results.toJSON());
  })

})