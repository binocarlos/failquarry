#Deployments
Deployments look after getting your code to run on servers and setting up networking between stacks.

They are what know about actual servers and are capable or adding/removing servers by connecting to **providers**

##Resources
Resources are literally raw computing things that can be requested from Cloud (IaaS) Providers:

 * Servers - blank Linux installations ready to be bootstrapped

 * Disks - API for cloud storage locations

 * Routers - dedicated routerware (like DNS or Load Balancing)

##Allocating Resources
Each stack has it's own resource allocation instructions.

A deployment can use these to create a weighted allocation across the top-level stacks.

So if there are 100 servers in a deployment and 2 top-level stacks - the 100 servers would be allocated.

Each stack would take it's 60/40 servers and bubble them down





If any of the stacks (at any level in the tree) start to complain about needing resources - they will broadcast events
which the deployment will pick up (via the Doctor)


How you arrange the stacks gives you an application which can be **deployed**.

You **deploy** an application by telling quarry.io to upload the code onto your servers and then spark the correct processes with the correct aguments.

These processes then breathe - small messages that provide status information about the process.



There are always MULTIPLE 



###Brokerless
There is NO BROKER - much like efficient warfare we don't want points of failure that take the whole ship down.




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
