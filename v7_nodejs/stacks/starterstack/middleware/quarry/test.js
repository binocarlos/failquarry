module.exports = function(options, network){
	return function(req, res, next){
		res.send('MANUAL FN: ' + req.query.test)
	}	
}

