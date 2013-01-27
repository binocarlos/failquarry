#warehouse
Warehouses are the routers of quarry.io

They are what decides where packets end-up.

They have a middleware stack - each is a fn(req, res, next) just like express.js

req and res are bootstrapped versions of packet.req and packet.res

You can mount middleware either raw (in which case-ordering decides)

Or using protocol / method combinations:

	// add a function directly onto the middleware stack
	warehouse.use(function(req, res, next){

	})

	// route all packets with method='select' here
	warehouse.use('select', function(req, res, next){

	})

	// protocol based routing
	warehouse.use('mongo://', function(req, res, next){

	})

Most often there will be one main (optimized) routing function that can decide to
split by protocol / users

If you call req.proxy and provide a supply chain, the packet is sent down it

If you call res.send the packet is returned down the supply chain it arrived on.