var quarry = require('quarry.io');


function socketIn(req, user_id){

	req.user_id = user_id;

	service_router(req);

}


// decide where to send the request based on the user_id
function service_router(req, next){

	// route by user id
	
}

quarry.boot(service_router).ready(function(warehouse){

})