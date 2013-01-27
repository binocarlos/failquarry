var containerFactory = require('../lib/container'),
		handy = require('../lib/tools/handy');

/*
var parent = containerFactory();
var child = containerFactory();
var child2 = containerFactory();

child.addClass('red');
child2.addClass('red');

parent.append(child);
parent.append(child2);

var subChild = containerFactory();
subChild.addClass('blue');

child2.append(subChild);

parent.find('.blue', '.red', function(error, resultsContainer){
	console.log('here');
  console.dir(resultsContainer.count());
});
*/

/*
 var generateImage = function(className){
  return containerFactory('image').addClass(className);
}

var generateGallery = function(className){
  return containerFactory('gallery').addClass(className);
}

var redGallery = generateGallery('red');
var blueGallery = generateGallery('blue');

var base = containerFactory();

base.append([redGallery, blueGallery]);

base.data('debug', true);

//    var img = generateImage('picasso').attr('size', 120);

//redGallery.append(img);

base.find('.red', function(error, resultsContainer){
	console.log('done');
  //console.dir(resultsContainer.children());
});
*/

/*
var generateImage = function(className){
  return containerFactory('image').addClass(className);
}

var generateGallery = function(className){
  return containerFactory('gallery').addClass(className);
}

var redGallery = generateGallery('red');
var blueGallery = generateGallery('blue');

var base = containerFactory();

base.append([redGallery, blueGallery]);

var img = generateImage('picasso').attr('size', 120);

redGallery.append(img);

base.find('image.picasso', '.blue', function(error, resultsContainer){
	console.dir(resultsContainer.count());
  
  
});
*/

