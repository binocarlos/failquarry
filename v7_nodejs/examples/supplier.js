var io = require('../');
var eyes = require('eyes');
var async = require('async');

var supplier = io.supplier.quarrydb({
	'collection':'testing123'
})

var child = io.new('product', {
	price:100
})

var grandchild = io.new('caption', {
	name:'testing123'
})

child.models[0].children || (child.models[0].children = []);
child.models[0].children.push(grandchild.toJSON()[0]);

async.series([
	function(next){
		var req = io.contract.request({
			method:'post',
			body:child.toJSON()
		})

		var res = io.contract.response();

		res.on('send', function(){
			
			child.models = res.body;

			console.log('-------------------------------------------');
			console.log('after POST');
			eyes.inspect(child.toJSON());
			next();
		})

		supplier(req, res, function(){
			res.send('not found');
		})
	},

	function(next){
		var req = io.contract.request({
			method:'get',
			url:'/?q=product'
		})

		var res = io.contract.response();

		res.on('send', function(){
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('after GET');
			eyes.inspect(res.toJSON());
			next();
		})

		supplier(req, res, function(){
			res.send('not found');
		})
	},

	function(next){

		child.attr('test', 10);

		var req = io.contract.request({
			method:'put',
			url:'/' + child.quarryid(),
			body:child.toJSON()[0]
		})

		var res = io.contract.response();

		res.on('send', function(){
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('after PUT');
			eyes.inspect(res.toJSON());
			next();
		})

		supplier(req, res, function(){
			res.send('not found');
		})
	},

	function(next){

		var req = io.contract.request({
			method:'delete',
			url:'/' + child.quarryid()
		})

		var res = io.contract.response();

		res.on('send', function(){
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('after DELETE');
			eyes.inspect(res.toJSON());
			next();
		})

		supplier(req, res, function(){
			res.send('not found');
		})
	}
])

