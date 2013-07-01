var io = require('../');
var eyes = require('eyes');

var container = io.new('product', {
	price:100,
	address:{
		postcode:'apples'
	}
}).addClass('test')

var xml = io.container('<product price="100" />')

eyes.inspect(container.models);
eyes.inspect(xml.models);

console.log('-------------------------------------------');
eyes.inspect(container.attr('address.postcode'));