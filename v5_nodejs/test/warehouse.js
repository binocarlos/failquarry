var io = require('../');
var eyes = require('eyes');
var fs = require('fs');

describe('warehouse', function(){

	it('should route select packets', function(done){
    io
		.warehouse({
			hostname:'root.warehouse'
		})
		.use(function(packet, next){
			done();
		})
		.ready(function(warehouse){

			warehouse('apples').ship();
			
		})
  })

	it('should find warehouse selectors', function(done){
	  io
		.warehouse({
			hostname:'root.warehouse'
		})
		.use(io.supplierchain('ram', {
			hostname:'ram.supplier',
		  data:io.new(fs.readFileSync(__dirname + '/../test/fixtures/cities.xml', 'utf8')).toJSON()
		}))
		.ready(function(warehouse){

		  warehouse('city area.rich', 'country[name^=s]').ship(function(results){

		  	results.attr('name').should.equal('Meadows');
		  	done();

		  })
		})
	})

	it('should find containers within the first results', function(done){

		io
		.warehouse({
			hostname:'root.warehouse'
		})
		.use(io.supplierchain('ram', {
			hostname:'ram.supplier',
		  data:io.new(fs.readFileSync(__dirname + '/../test/fixtures/cities.xml', 'utf8')).toJSON()
		}))
		.ready(function(warehouse){

		  warehouse('country[name^=s]').ship(function(countries){

		  	countries('city area.rich').ship(function(areas){
		  		areas.attr('name').should.equal('Meadows');
		  		done();
		  	})

		  	

		  })
		})

	})

	it('should route to multiple suppliers', function(done){

		var ramprovider = io.provider({
		  hostname:'ram.quarry.io'
		}).produce(function(filename){

		  var ext = filename.match(/\.(\w+)$/)[1]

		  return io.supplierchain('file/' + ext, {
		    hostname:'ram.quarry.io',
		    resource:filename,
		    file:__dirname + '/fixtures/' + filename
		  })

		})
		var defaultsupplychain = io.supplierchain('file/xml', {
		  hostname:'root.quarry.io',
		  file:__dirname + '/fixtures/stack.xml'
		})


		io.router({
		  hostname:'quarry.io'
		})
		.route('ram.quarry.io', ramprovider.supplychain())
		.use(defaultsupplychain)
		.ready(function(warehouse){

		  warehouse('city[name^=s]', '.db').ship(function(results){

		  	results.eq(0).attr('name').should.equal('Sydney');
		  	done();
		  })

		})
	})

})
