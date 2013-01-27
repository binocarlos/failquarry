var factory = require('../lib/container');

var container = factory([1,5,7,6,8]);

container.filter(function(child){

	return child.attr()<=5;
	
}).each(function(child){
	console.log('found');
	console.log(child.attr());
})

var container2 = factory({
	name:'test',
	_meta:{
		tagname:'product',
		classnames:{
			onsale:true
		}
	}
})

var container3 = factory({
	name:'child'
})

container3.attr('city', 'bristol')

console.dir(container3.attr());

container2.append(container3);

$quarry('product.cheap > img', '.quarry').ship(function(container){

	$container('product')
})


