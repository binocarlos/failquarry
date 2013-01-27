var io = require('../');


var test = io.new()
  .tagname('product')
  .attr({
    fruit:'apple',
    city:'London'
  })
  .attr({
    color:'red',
    price:100
  })
  .id('Big Apple')
  .attr('size', 'large')
  .addClass('onsale')
   
console.log('-------------------------------------------');
console.dir(test.toJSON());

/*
    test

    
    test.attr('color').should.equal('red');
    test.attr('size').should.equal('large');
    test.attr('city').should.equal('London');
    test.hasClass('onsale').should.equal(true);
    test.hasClass('badclass').should.equal(false);
    test.id().should.equal('Big Apple');
    test.tagname().should.equal('product');


  })
*/  

/*
  it('should be an event emitter', function (done) {

    var test = containerFactory();
    test.on('foo', done);
    test.emit('foo');

  })

  it('should allow blank children to be added', function () {

    var parent = containerFactory();
    var child = containerFactory();

    parent.append(child);

    parent.children().length.should.equal(1);
    parent.at(0).should.equal(child);

  })

  it('should fire an event when any children are added', function (done) {

    var base = containerFactory();
    var parent = containerFactory();
    var child = containerFactory();

    var appendCount = 0;

    base.on('append', function(element){
      appendCount++;

      if(appendCount>=2){
        done();
      }
    });

    base.append(parent);

    parent.append(child);

  })

  it('should be able to find children once they are added', function (done) {

    var parent = containerFactory();
    var child = containerFactory();

    child.addClass('red');

    parent.append(child);

    parent.find('.red', function(error, resultsContainer){
      resultsContainer.at(0).should.equal(child);
      done();
    });


  })

  it('should be able to find children within a context', function (done) {

    var generateImage = function(className){
      return containerFactory('image').addClass(className);
    }

    var generateGallery = function(className){
      return containerFactory('gallery').addClass(className);
    }

    var redGallery = generateGallery('red');
    var blueGallery = generateGallery('blue');

    var base = containerFactory();

    base.append([redGallery, blueGallery]);

    var img = generateImage('picasso').attr('size', 120);

    redGallery.append(img);

    base.find('image.picasso', '.red', function(error, resultsContainer){
      resultsContainer.at(0).should.equal(img);
      done();
    });

  })


  it('should be able to find children with attributes', function (done) {

    var generateImage = function(className){
      return containerFactory('image').addClass(className);
    }

    var generateGallery = function(className){
      return containerFactory('gallery').addClass(className);
    }

    var redGallery = generateGallery('red');
    var blueGallery = generateGallery('blue');

    var base = containerFactory();

    base.append([redGallery, blueGallery]);

    var img = generateImage('picasso').attr('size', 120);

    redGallery.append(img);

    base.find('image.picasso[size>100]', '.red', function(error, resultsContainer){
      resultsContainer.at(0).should.equal(img);
      done();
    });

  })

*/

