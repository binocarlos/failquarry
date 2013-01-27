var io = require('../../lib/quarryio');
var async = require('async');

var supply_chain_factory = function(container){

	var type = container.attr('supply_chain');

	if(!type || !io[type]){
		return null;
	}
	
	return io[type](container.attr());
}

// first the supply chain
var warehouse = io.warehouse(io.json_file({
	file:__dirname + '/country.json',
	pretty:true
})).branch(function(container){

	if(container.match('supplier')){
		console.log('-------------------------------------------');
		console.log('AT BRANCH FUNCTION');
		console.log(container.toString());
		console.dir(container.raw());
		return supply_chain_factory(container);
	}
	else{
		return false;	
	}
	
})

io.boot(warehouse).ready(function(quarry){

	quarry('fruit,area', '.food').each(function(result){
		console.log('-------------------------------------------');
		console.log(result.toString());
	})

})



/*



// new warehouse pointing to a JSON file
io.stack(
	io.warehouse(
		io.json_file({
			file:__dirname + '/country.json',
			pretty:true
		})
	)



	
})
.ready(function(warehouse){

		
		warehouse('city.cool').each(function(result){
			console.log('' + result);
		})
		

		warehouse('fruit', '.food').when(function(result){
			console.log('-------------------------------------------');
			console.log(result.count());
		})

})
*/

	/*
	var supplier = warehouse.create()
		.tagname('supplier')
		.attr({
			file:__dirname + '/fruit.json',
			pretty:true	
		})
		.addClass('food');
	
	warehouse.append(supplier);
	*/
	
	//console.dir(product.raw());

	//$quarry('product[price<100]');

/*
	.each(function(result){

		result
		.attr('price', 120)
		.append('caption', {
			text:'hello'
		})
		.save(function(){
			console.log('cool');

			result.find('caption').each(function(caption){

			})

			$quarry('caption', result).each(function(caption){

			})
		})

		

	})
*/
