#Stack
A stack is the arrangement of node.js processes linked with ZeroMQ sockets.

We can arrange stacks into really cool mashups - because stacks contain other stacks in a composite pattern.

In fact you can use QuarryDB selectors to mess with your stack:

		// load servers with node.js processes that are running hot
		$quarry('server > service[load>3]').each(function(hot_service){
			console.log(hot_service.attr('name') + ' is running very hot');
		})

##Examples
Because you can stick one stack inside of another it lets you build cool stuff.

Some examples of useful 'stacks':

 * HTTP router - accepts a HTTP request in and routes that request to the correct HTTP stack

 * Image resizer - accepts a file request in and returns a file response with a resized image

 * Hello world - accepts a ping request and replies with Hello World

 * Facebook - accepts a request for someones facebook credentials and returns stuff from their timeline

 * RPC warehouse - a single entry point that routes to 1457 different back-end functions across 15 different languages

 * VAT calculator - a single JavaScript function that accepts a number in and sends a number back out (single entry/exit points)

 * QuarryDB - a database stack that accepts a CSS selector in and returns JSON data

 * Twitter Filter - creates a portal to Twitter and emits events from it's public end-points as Twitter events occur

 * Stock Bot - creates a portal to NYSE, Nasdaq, LON etc and feeds price events through a 2000 strong deployment of maths stacks.

 * Supa Puta - manage 100,000 machines across 25 data-centers to process the data coming from CERN's particle accelerator (OK, I got carried away : )

^^^ Portals are just sockets that stay open to somewhere innit

So - you can see the point I'm making:

	a stack is a generic composite concept where a message goes in and is processed/routed onto other stacks

##Deployments
How you arrange the stacks gives you an application which can be **deployed**.

You **deploy** an application by telling quarry.io to upload the code onto your servers and then spark the correct processes with the correct aguments.

They then breathe and start talking to each other in a peer-to-peer manner.

###Brokerless
There is NO BROKER - much like efficient gur


##Stack Characters

###RPC
Accepts a message into a function and replies with a message back.

An RPC stack can expose a single function or multiple public end-points.

The public API describes what javascript functions the RPC stack provides.

An RPC stack always has the option to route (which lets it send messages to other stacks).
 		
 * Middleware - accepts a message into a function - passes it through an array of middleware and replies with a message back

 * Router - accepts a message into a function and routes it onto other stacks and makes sure the answer gets returned if there is one
 		
 * Sink - same as router (it gets the message passed on) but it does not provide any kind of answer - this must be co-ordinated further in the stack





These are the important things for a stack to think about:

 * Entry/Exit strategy - how do you get a message in and out of this stack

 		* Entry Points - declares what type of messages this stack is expecting inwards (this is sort of the manifest for what it can do)

 		* Exit Points - declares places a message might come out of the stack (this gives you the options for further routing to other stacks etc)

 * Events - things that this stack will broadca
 * Workers - JavaScript middleware function stack ([Connect Inspired](http://www.senchalabs.org/connect/)

		* Bootstrapping - what character is the worker - each character can have lots of templates.

			* HTTP - a connect/express app template

			* RPC - a request for message processing with a clear response for each request

			* 

 		* Middleware - what JS functions to stack up for each service

 		* Naming - how to address the service inside of the stack





A stack is a collection of quarry.io processes that will do work for you.

It also describes how these processes will communicate - the overall stack has:
