var eyes = require('eyes');

module.exports = function(){

	/*


		The main routing function for the entry warehouse

	 */
	return function(req, res, next){

		console.log('-------------------------------------------');
		eyes.inspect(req.path());
		if(req.path()=='/'){
			// redirect to the default database path
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('redirecting');
			req.redirect('/ram/file/xml/cities');	
		}
		else{

			next();
		}
		
	}

}