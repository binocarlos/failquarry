var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');

var supplierdb = {
  
}

var supplychains = {
  'root.quarry.io':io.supplychain('file/xml', {
    hostname:'root.quarry.io',
    file:__dirname + '/stack.xml'
  }),
  'cities.xml.quarry.io':io.supplychain('file/xml', {
    hostname:'cities.xml.quarry.io',
    file:__dirname + '/cities.xml'
  }),
  'cities.json.quarry.io':io.supplychain('file/json', {
    hostname:'cities.json.quarry.io',
    pretty:true,
    file:__dirname + '/cities.json'
  }),
  'fruit.xml.quarry.io':io.supplychain('file/xml', {
    hostname:'fruit.xml.quarry.io',
    file:__dirname + '/fruit.xml'
  }),
  'fruit.json.quarry.io':io.supplychain('file/json', {
    hostname:'xml.json.quarry.io',
    pretty:true,
    file:__dirname + '/fruit.json'
  }),
  'local.files.quarry.io':io.supplychain('filesystem/local', {
    hostname:'local.files.quarry.io',
    path:__dirname + '/../static/icons/default'
  }),
  'flickr.api.quarry.io':io.supplychain('api/flickr', {
    hostname:'flickr.api.quarry.io',
    apikey:'44c3c3c80c7753619d52e912b90aacbe'
  })
};

var default_hostname = 'root.quarry.io';

function rewrite(hostname){

  // this means the default
  return !hostname || hostname=='root.warehouse' ? default_hostname : hostname;
}

function router(packet, next){
  var hostname = rewrite(packet.hostname());

  var supply_chain = supplychains[hostname];

  supply_chain(packet, next);
}

io
.warehouse({
  hostname:'root.warehouse'
})
.use(router)
.ready(function(warehouse){

  warehouse('image.red', '#flickr').ship(function(results){
    console.log('-------------------------------------------');
    console.log('here');
    eyes.inspect(results.toJSON());
  })
/*

  warehouse('.db').ship(function(results){

    results.find('#citiesxml').select('city').ship(function(cities){

      results.find('#citiesjson').append(cities, function(results){
        eyes.inspect(results.toJSON());
      })
    })

  })
*/
 // warehouse('> *', '#localfiles').ship(function(results){

   // eyes.inspect(results.toJSON());  

    /*
    var cities = results.find('city');
    var folder = results.find('#applesfolder');

    folder.append(cities, function(results){
      //eyes.inspect(results.toJSON());  
    })
   
    */
    


/*
    .select('city').ship(function(){

    })

    function(cities){
      console.log('-------------------------------------------');
      console.log('have run selector');
      eyes.inspect(cities.toJSON());
    })
*/

    //results.find('#fruitjson').append()

    

  //})
})