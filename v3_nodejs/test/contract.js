var contractFactory = require('../lib/legal/contract'),
		handy = require('../lib/tools/handy');

describe('contract', function(){

	it('should be a function', function () {
		contractFactory.should.be.a('function');
  })

  it('should return a contract object', function () {
		contractFactory().phases.should.be.a('function');
  })

  it('should parse a simple selector', function () {

  	var contract = contractFactory('product.onsale[price<100] > image');

  	var phase = contract.phase(0);
  	
  	var productSelector = phase.selector(0);

  	productSelector.tag().should.equal('product');

  	productSelector.class().onsale.should.equal(true);
  	productSelector.attr()[0].field.should.equal('price');
  	productSelector.attr()[0].operator.should.equal('<');
  	productSelector.attr()[0].value.should.equal('100');
  	
  	var imageSelector = phase.selector(1);

    imageSelector.splitter().should.equal('>');
  	imageSelector.tag().should.equal('image');
		
  })


})
