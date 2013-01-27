var jquarry = require('../');

describe('jquarry', function(){

	it('should expose a version number', function () {
    jquarry.version.should.match(/[0-9]+\.[0-9]+\.[0-9]+/);
  })

  it('must expose public constructors', function () {
    jquarry.should.be.a('function');
  });

})
