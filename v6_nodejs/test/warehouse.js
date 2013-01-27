var io = require('../');
var eyes = require('eyes');
var fs = require('fs');

describe('warehouse', function(){

	it('should be a function', function () {
		io.warehouse.should.be.a('function');
	})

	it('should find things', function(done){

		//console.log = function(){}
		eyes.inspect = function(){}
		var old_log = console.log;
		console.log = function(){}

		var folder = __dirname + '/fixtures/warehouse';
		var livefile = folder + '/cities.xml';
		var backupfile = folder + '/cities_template.xml';

		var content = fs.readFileSync(backupfile, 'utf8');
		fs.writeFileSync(livefile, content, 'utf8');

		var supplier_config = {
			"driver":"ram.file",
			"directory":folder,
			"path":"cities",
			"format":"xml"
		}

		io
		.supplier(supplier_config)
		.ready(function(warehouse){

			warehouse('area', 'folder city[name^=b]')
					
				.ship(function(areas){
					console.log = old_log;
					//console.log('count: ' + areas.count());
					areas.count().should.equal(4);
					
					done();
				})
		})
		

	})


	it('should append things', function(done){

		//console.log = function(){}
		eyes.inspect = function(){}
		var old_log = console.log;
		console.log = function(){}

		var folder = __dirname + '/fixtures/warehouse';
		var livefile = folder + '/cities.xml';
		var backupfile = folder + '/cities_template.xml';

		var content = fs.readFileSync(backupfile, 'utf8');
		fs.writeFileSync(livefile, content, 'utf8');

		var supplier_config = {
			"driver":"ram.file",
			"directory":folder,
			"path":"cities",
			"format":"xml"
		}
		
		io
		.supplier(supplier_config)
		.ready(function(warehouse){

			warehouse('folder city[name^=b]')
			
				.ship(function(cities){

					var area = io.new('area', {
						name:'Bishopston',
						population:387
					}).addClass('rich')

					cities.append(area).ship(function(appended){

						var house = io.new('house', {
							name:'Big House',
							population:3
						}).addClass('grand')

						appended.append(house)
						.ship(function(houses){

							warehouse('folder city[name^=b] area[name^=Bish] house').ship(function(houses){
								houses.eq(1).attr('name').should.equal('Big House');
								console.log = old_log;
								done();
							})

						})
						
						
						
					})



					
				})
		})

	})

})
