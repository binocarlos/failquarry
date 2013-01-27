var io = require('../');
var eyes = require('eyes');
var fs = require('fs');
var Fs = require('meta-fs');

describe('supplier', function(){

	it('should serve containers', function(done){

		var xml_supplier = io.supplierchain('file/xml', {
			hostname:'xml.supplier',
			file:__dirname + '/../test/fixtures/cities.xml'
		})

	  io
		.warehouse({
			hostname:'root.warehouse'
		})
		.use(xml_supplier)
		.ready(function(warehouse){

		  warehouse('city area.rich', 'country[name^=s]').ship(function(results){

		  	console.log('-------------------------------------------');
		  	eyes.inspect(results.toJSON());

		  	results.attr('name').should.equal('Meadows');
		  	done();

		  })
		})
	})

	it('should save', function(done){

		
		var origcities = __dirname + '/fixtures/cities.xml';
		var outcities = __dirname + '/fixtures/citiesout.xml';

		Fs.remove(outcities, function(){
			Fs.copy(origcities, outcities, function(){
				var xml_supplier = io.supplierchain('file/xml', {
					hostname:'xml.supplier',
					file:outcities
				})

			  io
				.warehouse({
					hostname:'root.warehouse'
				})
				.use(xml_supplier)
				.ready(function(warehouse){

				  warehouse('city[name^=bris]').ship(function(results){

				  	results.attr('fruit', 'peaches');

				  	results.save(function(){
				  		results.attr('fruit').should.equal('peaches');

				  		var xml_supplier2 = io.supplierchain('file/xml', {
								hostname:'xml.supplier',
								file:outcities
							})
				  		io
								.warehouse({
									hostname:'root.warehouse'
								})
								.use(xml_supplier2)
								.ready(function(warehouse2){
									warehouse2('city[name^=bris]').ship(function(results){
										results.attr('fruit').should.equal('peaches');
										done();
									})
								})
				  	})
				  })
				})
			})
			
		})
	})

	it('should delete', function(done){

		var origcities = __dirname + '/fixtures/cities.xml';
		var outcities = __dirname + '/fixtures/citiesout.xml';

		Fs.remove(outcities, function(){
			Fs.copy(origcities, outcities, function(){
				var xml_supplier = io.supplierchain('file/xml', {
					hostname:'xml.supplier',
					file:outcities
				})

			  io
				.warehouse({
					hostname:'root.warehouse'
				})
				.use(xml_supplier)
				.ready(function(warehouse){

				  warehouse('city[name^=b]').ship(function(results){

				  	results.eq(0).delete(function(){

				  		var xml_supplier2 = io.supplierchain('file/xml', {
								hostname:'xml.supplier',
								file:outcities
							})
				  		io
								.warehouse({
									hostname:'root.warehouse'
								})
								.use(xml_supplier2)
								.ready(function(warehouse2){
									warehouse2('city[name^=b]').ship(function(results){
										results.count().should.equal(1);
										done();
									})
								})
				  	})
				  })
				})
			})
			
		})
	})

	it('should append', function(done){

		var origcities = __dirname + '/fixtures/cities.xml';
		var outcities = __dirname + '/fixtures/citiesout.xml';

		Fs.remove(outcities, function(){
			Fs.copy(origcities, outcities, function(){
				var xml_supplier = io.supplierchain('file/xml', {
					hostname:'xml.supplier',
					file:outcities
				})

			  io
				.warehouse({
					hostname:'root.warehouse'
				})
				.use(xml_supplier)
				.ready(function(warehouse){

				  warehouse('city[name^=bris]').ship(function(results){

				  	var area = io.new('area', {
				  		name:'Lockleaze',
				  		fruit:'apples'
				  	}).addClass('poor')

				  	results.append(area, true).ship(function(appended){
				  		
				  		var xml_supplier2 = io.supplierchain('file/xml', {
								hostname:'xml.supplier',
								file:outcities
							})
				  		io
								.warehouse({
									hostname:'root.warehouse'
								})
								.use(xml_supplier2)
								.ready(function(warehouse2){
									warehouse2('area.poor[name^=l]', 'city[name^=bris]').ship(function(results){
										
										results.attr('fruit').should.equal('apples');
										done();
									})
								})
				  	})
				  	

				  })
				})
			})
			
		})

		
		
	})

})
