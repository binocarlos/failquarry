module.exports = function(options, network){
	return function(req, res, next){
		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.dir(req.user);
		console.dir(req.session);
		res.json(req.user);
	}
}