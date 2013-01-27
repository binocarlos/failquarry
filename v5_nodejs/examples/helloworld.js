var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');

var warehouse = io.warehouse(function(packet, callback){
	callback(null, packet);
})


var generateImage = function(className){
      return warehouse.new('image').addClass(className);
    }

    var generateGallery = function(className){
      return warehouse.new('gallery').addClass(className);
    }

    var redGallery = generateGallery('red');
    var blueGallery = generateGallery('blue');

    var base = warehouse.new();

    base.append([redGallery, blueGallery]);

    var img = generateImage('picasso').attr('size', 120);

    redGallery.append(img);

    //base.find('.red', 'hello', 'apples')

    eyes.inspect(base.find('.red').toJSON());
/*

var parent = warehouse.new();
var child = warehouse.new();

child.addClass('red');
child.attr('test', 10);

parent.append(child);

eyes.inspect(parent.find('.red').toJSON());




var data = fs.readFileSync(__dirname + '/../test/fixtures/cities.xml', 'utf8');

var parent = warehouse.new(data);

parent.on('boo', function(){
	console.log('boo');
})

parent.emit('boo')

parent.each(function(folder){
	console.log('-------------------------------------------');
	console.log('Folder: ' + folder.summary());
})

parent.children().each(function(country){
	console.log('-------------------------------------------');
	console.log('Country: ' + country.summary());
})

parent.find('country city[name^=b] area').each(function(country){
	console.log('-------------------------------------------');
	console.log('Country Find: ' + country.summary());
})

//eyes.inspect(data);


var parent = warehouse.new();
var child = warehouse.new();

child.addClass('red');

parent.append(child);

var results = parent.find('.red > product, hello', 'apples');

console.log('-------------------------------------------');
console.log('-------------------------------------------');
console.log('HERE');

*/