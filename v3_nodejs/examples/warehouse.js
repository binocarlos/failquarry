var jquarry = require('../');

// load up a new
jquarry.warehouse({
	file:__dirname + '/warehouse.json',
}).on('ready', function(error, warehouse){

	
	var newProduct = jquarry('product', {
		price:23,
		name:'Table'
	});
	

	warehouse.find('file[name=$"js"]', function(error, results){


		results.each(function(result){

			
			console.log(result.toString());
			
			/*
			product.attr('color', 'GREEN');
			product.save();
			*/
		});
		
	})
	
});
