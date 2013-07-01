/*

   this stops our custom logger wrapper
  
*/
process.env.TEST_MODE = true;
process.env.NODE_ENV = 'test';

var io = require('../');
var eyes = require('eyes');
var data = require('./fixtures/data');

describe('container', function(){

  it('should create from basic data', function() {
  	var test = io.new('product', {
  		price:100,
  		address:{
  			postcode:'apples'
  		}
  	})

  	test.should.be.a('function');

  	test.attr('price').should.equal(100);
  	test.attr('address.postcode').should.equal('apples');
  	test.tagname().should.equal('product');
  })

  it('should append and find children', function() {
    var parent = io.new('product', {
      price:100,
      address:{
        postcode:'apples'
      }
    })

    var child1 = io.new('caption', {
      test:'hello1'
    }).addClass('apples')

    var child2 = io.new('caption', {
      test:'hello2'
    }).addClass('oranges')

    parent.append([child1, child2]);

    parent.children().count().should.equal(2);
    parent.first().tagname().should.equal('product');
    parent.find('.apples').tagname().should.equal('caption');
    parent.find('.oranges').attr('test').should.equal('hello2');
  })

  it('should process XML into a container tree', function() {

    var xmltree = io.new(data.simplexml);

    xmltree.tagname().should.equal('folder');
    xmltree.find('product').count().should.equal(2);
    xmltree.find('product.red caption').count().should.equal(3);
    xmltree.find('caption').count().should.equal(5);
    xmltree.find('product.purple').children().count().should.equal(2);
  })

  

  
})
