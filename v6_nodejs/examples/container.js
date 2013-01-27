var io = require('../');
var eyes = require('eyes');

var generateImage = function(className){
  return io.new('image').addClass(className);
}

var generateGallery = function(className){
  return io.new('gallery').addClass(className);
}

var redGallery = generateGallery('red');
var blueGallery = generateGallery('blue');

var img = generateImage('picasso').attr('size', 120);

redGallery.append(img);

var base = io.new('folder');

base.append([redGallery, blueGallery]);

//base.find('image.picasso', '.red').attr('size').should.equal(120);

eyes.inspect(base.descendents().toJSON());