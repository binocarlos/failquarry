#Characters
So - a deployment is how we can get our code onto servers around the world.

A stack is how we arrange our code and route message to and through it.

Characters are useful starting places for you to write your stack code.

By choosing a character to base your code on, you get a head-start.

You can of course just write your own function(message, next) but characters
provide useful tools to a stack.

##The players
Here is a list of notable characters:

 * HTTP Server - route URL's onto JavaScript functions and reply with HTTP (HTTP_REQ -> STACK -> HTTP_REP)

 * Socket Server - route socket messages into the stack and route messages back (SOCKET_SUB -> STACK -> SOCKET_PUB)

 * HTTP Router - route HTTP headers (hostname / URL) onto HTTP Servers and proxy result (HTTP_REQ -> STACK -> HTTP_REP)

 * Message Router - route messages to other places in the stack, return answers back down the wire (ROUTER -> STACK [ -> ROUTER ])

 * Message Pipe - grab messages and close the wire, then pipe the message onto somewhere (PUSH -> STACK)

 * Hub - a central end-point to connect to to send and recieve messages (SUB -> STACK -> PUB)

 * RPC - a request / reply setup - the main worker (REQ -> STACK -> REP)

 * REST - a HTTP server but more like RPC than serving images (HTTP_REQ -> STACK -> HTTP_REP)

 * JSON - like RPC but HTTP instead so you have an Ajax end-point

The point is I'm starting to go off on thinking of the easy chracters I can make - the system is extensible.



 





