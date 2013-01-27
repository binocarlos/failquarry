var io = require('../');
//var eyes = require('eyes');

describe('model', function(){

	it('should be a function', function () {
		io.model.should.be.a('function');
	})

	it('should allow access to data', function () {
		var model = io.model();
		var inst = new model({ test: { text: 'hello', value:321} });

		var temp = inst.get('test.text');
		temp.should.equal('hello');
		
		inst.bind('change:test.text', function(model, val) {
			val.should.equal('world');
		});

		inst.set({'test.text':'world'});
		
		temp = inst.get('test.text');
		temp.should.equal('world');
		
		//eyes.inspect(inst.get('test'));
	})

})
