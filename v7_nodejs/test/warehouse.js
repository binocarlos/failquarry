/*

   this stops our custom logger wrapper
  
*/
process.env.TEST_MODE = true;
process.env.NODE_ENV = 'test';

var io = require('../');
var eyes = require('eyes');
var data = require('./fixtures/data');

describe('warehouse', function(){

  it('should route requests', function(done) {

    var warehouse = io.warehouse();
  	
    warehouse.get('/apples', function(req, res, next){
      req.setHeader('fruit', 'apples');
      next();
    })

    warehouse.get('/apples', function(req, res, next){
      req.getHeader('fruit').should.equal('apples');
      res.send('ok');
    })

    var req = io.request({
      method:'get',
      url:'/apples'
    })

    var res = io.response(function(){
      res.body.should.equal('ok');
      done();
    })

    warehouse(req, res, function(){
      res.send404();
    })
  })

  

  

  
})
