var io = require('../');

describe('quarry.io', function(){

  it('should expose a version string', function() {
    io.should.have.property('version');
    io.version.should.be.a('string');
  })

  it('should expose a warehouse function', function() {
    io.should.have.property('warehouse');
    io.warehouse.should.be.a('function');
  })

  it('should expose a new function', function() {
    io.should.have.property('new');
    io.new.should.be.a('function');
  })

  it('should expose a model function', function() {
    io.should.have.property('model');
    io.model.should.be.a('function');
  })

  it('should expose a supplier function', function() {
    io.should.have.property('supplier');
	io.supplier.should.be.a('function');
  })

  it('should expose a reception function', function() {
    io.should.have.property('reception');
    io.reception.should.be.a('function');
  })

  it('should expose a switchboard function', function() {
    io.should.have.property('switchboard');
    io.switchboard.should.be.a('function');
  })

  it('should expose a network function', function() {
    io.should.have.property('network');
    io.network.should.be.a('function');
  })

  it('should expose a stack function', function() {
    io.should.have.property('stack');
    io.stack.should.be.a('function');
  })

})
