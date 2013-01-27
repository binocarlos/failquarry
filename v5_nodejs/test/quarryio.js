var io = require('../');

describe('quarry.io', function(){

	it('should expose a version number', function() {
		io.version.should.be.a('string');
  })

  it('should expose a warehouse function', function() {
    io.warehouse.should.be.a('function');
  })

  it('should expose a new function', function() {
    io.new.should.be.a('function');
  })

})
