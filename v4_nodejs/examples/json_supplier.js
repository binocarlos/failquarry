var io = require('../lib/quarryio');
var async = require('async');
var eyes = require('eyes');

var default_pointer = {
	type:'json_file',
	file:__dirname + '/country.json',
	pretty:true
}
// the factory function for the warehouse
var factory = function(pointer){

	pointer || (pointer = default_pointer);

	if(!pointer.type || !io[pointer.type]){
		return null;
	}
	
	return io[pointer.type](pointer);
}

// first the supply chain
var supply_chain = io.warehouse(io.json_file({
	file:__dirname + '/country.json',
	pretty:true
})).branch('supplier', function(container){

	return supply_chain_factory(container);
	
})

io.warehouse(io.json_file({
	file:__dirname + '/country.json',
	pretty:true
}))
.use(function(req, next){
	// filter the previous to see if we want to branch the supply chain
	if(req.action=='select'){
		_.each(req.message.previous, function(raw){
			var test_container = io.container(raw);
		})
	}
})
.ready(function(warehouse){

	warehouse('supplier.testjson').first(function(quarry){
		console.log('-------------------------------------------');
		console.log(quarry.toString());	
		warehouse('area, fruit[name$=s]', '.json, .food').when(function(result){

			result.pourInto(quarry);
			
		})
		
	})

})


/*
	// first get the quarrydb supplier
	root('.quarrydb').first(function(db){

		console.log('have quarrydb');
		console.log(db.toString());

		root('city').when(function(cities){

			console.log('-------------------------------------------');
			console.log('POURING');
			cities.pourInto(db);
		})
		
		//eyes.inspect(db.raw())
		//console.log(db.toString());
	})
*/
/*
	quarry('product#hello.red[price<100] > img, area', '.food').each(function(result){
		console.log('-------------------------------------------');
		console.log(result.toString());
	})
*/




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
