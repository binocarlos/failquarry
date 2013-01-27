var io = require('../lib/quarryio');

// create a root data source to hold our containers
var data_source = io.json_file({	
	file:__dirname + '/test.json'			
})

// make a new warehouse so we can run selectors against the data source
io.warehouse(data_source)
.ready(function(warehouse){

	var container2 = warehouse.factory('product', {
		name:'test'
	})
	.addClass('onsale');

	warehouse('product[price<100]').each(function(product){

		// load over the network
		product.ship('caption[name$=t]').each(function(caption){

		})

		// traverse the local data
		product.find('caption[name$=t]').each(function(caption){

		})
	})

	// load over the network and get top level results container
	warehouse('product[price<100]').when(function(products){

	})

})



/*
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


*/