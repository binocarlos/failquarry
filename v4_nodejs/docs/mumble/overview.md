#Terminology
The various actors in this here play.

##Router
A single node.js process that is responsible for passing a message onto another process in the deployment.

Routers perform various roles:

 * Routing - know which specific worker to send a message to (singleton, service name, majordomo)
 * Splitting - know how to split and forward the parts of a message to correct places (fan-out, break down large problem)
 * Load Balancing - distribute work to least busy / most appropriate place (CDN, A.I system health)

Routers are used in the message chain as logic gates

##Worker
A single node.js process that can run code-blocks over incoming messages.

The worker has access to the entire project codebase and so can take on any role within the system - it is the code runner.

It is a strict REQ/REP end point - all the worker code has to do is accept a message, a router instance (optional) and a callback.

###Example Worker
This is an example of a worker file that calculates VAT - the callback uses the classic node.js style of error, return_value

	function vat(amount, next){
		next(null, amount * 1.2);
	}

	module.exports = vat;

If the above were in vat.js then we can use it as a worker.

###Worker Routing
A worker function can optionally specify a router as an argument - this will be a router instance and the worker function
can use it to call other end-points.

For example - imagine we have an end-point called 'convert_to_euros' - we can pass the vat amount via it before continuing:

	function vat(amount, router, next){
		router.request('convert_to_euros', amount, next);
	}

	module.exports = vat;

This means the answer getting passed foward into the routing chain but only once it has been passed via the convert_to_euros
endpoint.

##Broadcaster
A node.js process acting as a message exchange for various parts of the system.

This is a simple PUB/SUB setup

##Service
A named end-point within the system - usually a router front with workers back.

This gives a named destination for messages in the messate chain.

##Message Chain
An arrangement of the above into a distinct message flow (i.e. an application).

##Deployment
An entire self-contained global deployment of a quarry.io system - this is basically a collection of message flows.