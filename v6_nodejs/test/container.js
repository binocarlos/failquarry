var io = require('../');
var eyes = require('eyes');

describe('container', function(){

  it('should return a function', function () {
    var container = io.new();
    container.should.be.a('function');
  })

  it('tagname should set, chain, reset and get', function () {
    var container = io.new();
	// Set and test chain
	container.tagname('product').should.equal(container);
	// Test get
    container.tagname().should.equal('product');
	// Test reset (and chain and get)
    container.tagname('item').tagname().should.equal('item');
  })

  it('id should set, chain, reset and get', function () {
    var container = io.new();
	// Set and test chain
	container.id('product').should.equal(container);
	// Test get
    container.id().should.equal('product');
	// Test reset (and chain and get)
    container.id('item').id().should.equal('item');
  })

  it('attr should set, chain, reset and get attributes', function () {
    var container = io.new();
	// Test get of whole empty attr
	container.attr().should.be.a.null;
	// Set and test chain
    container.attr('price', 25).should.equal(container);
	// Test get of whole attr
	container.attr().should.eql({price:25});
	// Test get attr
    container.attr('price').should.equal(25);
	// Test reset (and chain and get)
    container.attr('price', 50).attr('price').should.equal(50);
  })

  it('attr should set and get nested attributes into blank', function () {
    var container = io.new();
	// Set nested and test chain
    container.attr('fruit.apples', 25).should.equal(container);
    // Set nested via get object
	container.attr('fruit').pears = 10;
	// Test get object set as nested
    container.attr('fruit').apples.should.equal(25);
	// Test nested get set as nested
    container.attr('fruit.apples').should.equal(25);
	// Test get object set via get
    container.attr('fruit').pears.should.equal(10);
	// Test nested get set via get
    container.attr('fruit.pears').should.equal(10);
  })

  it('attr should set and get nested attributes into object attr', function () {
    var container = io.new({
      'fruit':{}
    })

	// Set nested and test chain
    container.attr('fruit.apples', 25).should.equal(container);
    // Set nested via get object
	container.attr('fruit').pears = 10;
	// Test get object set as nested
    container.attr('fruit').apples.should.equal(25);
	// Test nested get set as nested
    container.attr('fruit.apples').should.equal(25);
	// Test get object set via get
    container.attr('fruit').pears.should.equal(10);
	// Test nested get set via get
    container.attr('fruit.pears').should.equal(10);
  })

  it('addClass should work', function () {
    var container = io.new();
	// Add and test chain
	container.addClass('product').should.equal(container);
	// Test has
	container.hasClass('product').should.equal(true);
	container.hasClass('large').should.equal(false);
	// Add another
	container.addClass('large');
	// Test has
	container.hasClass('product').should.equal(true);
	container.hasClass('large').should.equal(true);
	container.hasClass('plastic').should.equal(false);
	// Add another
	container.addClass('plastic');
	// Test has
	container.hasClass('product').should.equal(true);
	container.hasClass('large').should.equal(true);
	container.hasClass('plastic').should.equal(true);
	container.hasClass('bad').should.equal(false);
  })

  it('removeClass should work', function () {

	var container;

	function maketripleclass() {
		return io.new()
		.addClass('product')
		.addClass('large')
		.addClass('plastic');
	};

	container = maketripleclass();
	// Remove first and test chain
	container.removeClass('product').should.equal(container);
	// Check result
	container.hasClass('product').should.equal(false);
	container.hasClass('large').should.equal(true);
	container.hasClass('plastic').should.equal(true);
	container.hasClass('bad').should.equal(false);

	container = maketripleclass();
	// Remove middle and test chain
	container.removeClass('large').should.equal(container);
	// Check result
	container.hasClass('product').should.equal(true);
	container.hasClass('large').should.equal(false);
	container.hasClass('plastic').should.equal(true);
	container.hasClass('bad').should.equal(false);

	container = maketripleclass();
	// Remove last and test chain
	container.removeClass('plastic').should.equal(container);
	// Check result
	container.hasClass('product').should.equal(true);
	container.hasClass('large').should.equal(true);
	container.hasClass('plastic').should.equal(false);
	container.hasClass('bad').should.equal(false);
  })



  it('should allow blank construction and attribute manipulation', function () {

    var test = io.new()
      .tagname('product')
      .attr({
        fruit:'apple',
        city:'London'
      })
      
    test
    .attr({
      color:'red',
      price:100
    })
    .id('Big Apple')
    .attr('size', 'large')
    .addClass('onsale');
    
    test.attr('color').should.equal('red');
    test.attr('size').should.equal('large');
    test.attr('city').should.equal('London');
    test.hasClass('onsale').should.equal(true);
    test.hasClass('badclass').should.equal(false);
    test.id().should.equal('Big Apple');
    test.tagname().should.equal('product');


  })

  it('should allow blank children to be added', function () {

    var parent = io.new();
    var child = io.new();

    child.attr('fruit', 'apples');

    parent.append(child);

    parent.children().count().should.equal(1);
    parent.children().eq(0).attr('fruit').should.equal('apples');
    
  })


  it('should be able to find children once they are added', function() {

    var parent = io.new();
    var child = io.new();

    child.addClass('red');
    child.attr('test', 10);

    parent.append(child);

    parent.find('.red').attr('test').should.equal(10);
  })


  it('should be able to find children within a context', function() {

    var generateImage = function(className){
      return io.new('image').addClass(className);
    }

    var generateGallery = function(className){
      return io.new('gallery').addClass(className);
    }

    var redGallery = generateGallery('red');
    var blueGallery = generateGallery('blue');

    var img = generateImage('picasso').attr('size', 120);

    redGallery.append(img);

    var base = io.new();

    base.append([redGallery, blueGallery]);

    base.find('image.picasso', '.red').attr('size').should.equal(120);
	base.find('image.picasso', '.blue').should.have.length(0);
  })

  it('should be able to find children with attributes', function() {

    var generateImage = function(className){
      return io.new('image').addClass(className);
    }

    var generateGallery = function(className){
      return io.new('gallery').addClass(className);
    }

    var redGallery = generateGallery('red');
    var blueGallery = generateGallery('blue');

    var img = generateImage('picasso').attr('size', 120);
    redGallery.append(img);

    var base = io.new();

    base.append([redGallery, blueGallery]);

    base.find('image.picasso[size>=120]', '.red').attr('size').should.equal(120);

  })

})
