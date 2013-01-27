var io = require('../');
var eyes = require('eyes');

describe('container', function(){

	it('should be a function', function () {
    var container = io.new();

		container.should.be.a('function');
  })

  it('should allow nested attributes', function () {
    var container = io.new({
      'fruit':{}
    })

    container.attr('fruit.apples', 25);

    container.attr('fruit').apples.should.equal(25);
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
