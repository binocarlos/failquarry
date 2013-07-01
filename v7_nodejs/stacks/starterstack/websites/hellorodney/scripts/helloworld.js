function(warehouse, req, res){
	warehouse('.ghost > *:tree').ship(function(ghosts){
		res.send('DATA: ' + req.query.test + ' = ' + ghosts.peek());
	})
}