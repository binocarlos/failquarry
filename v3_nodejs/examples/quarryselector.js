var jquarry = require('../');
var handy = require('../lib/tools/handy');

// load up a new
jquarry.warehouse({
	file:__dirname + '/quarrydbwarehouse.json',
}).on('ready', function(error, warehouse){



	warehouse.find('image.purple > caption', function(error, result){

		console.log('-------------------------------------------');
		console.log('result');
		console.dir(result.count());
		
	});

	/*
	warehouse.each('image.red', function(error, result){

		console.log('-------------------------------------------');
		console.log('result');
		console.dir(result.toString());
		
	}, function(){
		warehouse.close();
	});


	warehouse.find('image.red', function(error, result){

		console.log('-------------------------------------------');
		console.log('result');
		console.dir(result.count());
		
	});


	var buildCaption = function(img, num){
		var caption = jquarry('caption', {
			name:'Test Caption ' + num
		}).addClass('red');

		img.append(caption);
	}
	var buildImage = function(product, num){
		var img = jquarry('image', {
			name:'Test Image ' + num
		}).addClass('red');

		product.append(img);

		for(var i=0; i<5; i++){
			buildCaption(img, i);
		}
	}

	var newFolder = jquarry('folder', {
		name:'Test Folder'
	}).addClass('red');

	var newProduct = jquarry('product', {
		price:23,
		name:'Table'
	});

	for(var i=0; i<3; i++){
		buildImage(newProduct, i);
	}
	
	newFolder.append(newProduct);
*/

	//console.log(handy.dir(newFolder.raw()));
/*
	warehouse.findSuppliers('.quarrydb', function(error, suppliers){

		if(suppliers.count()<=0){
			console.log('no suppliers found');
			return;
		}

		var quarrySupplier = suppliers.at(0);

		quarrySupplier.append(newFolder, function(){
			console.log('ALL APPENDED');
			warehouse.close();
		});

		//console.dir(suppliers.count());
		//warehouse.close();
		
	})

*/
	//
	/*
	warehouse.find('file[name=$"js"]', function(error, results){


		results.each(function(result){

			
			console.log(result.toString());
			
			product.attr('color', 'GREEN');
			product.save();
			
		});
		
	})
	*/
	
});
