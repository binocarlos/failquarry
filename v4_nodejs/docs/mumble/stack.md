#Stack
A stack is a collection of quarry.io processes that will do work for you.

It also describes how these processes will communicate - the overall stack has:

##Overview
A stack must describe what processes are to be run and how to communicate between them.

###Stack Config
Each stack has overall config:

 * Routes - a named collection of public entry points along with a description of their exit points

 * Service Map - the named services in this stack, you can address each service by it's name directly

###Service Config
Each service provides p


There are 2 parts to a stack:

 * Services - end-points (either workers or routers or other stacks) that will process messages for you
 * Computers - computers upon which you can run services
 * Data Centers - IaaS providers that can add/remove computers from a stack

Stacks can live as end-points in other stacks - Lego!

##Services
A stack has a list of services that it will co-ordinate.

Each service is simply a path to a node.js program and some options to pass it.

So if I have some worker code called 'calculate_vat.js' which I can configure by passing the vat rate on the command line:

	node calculate_vat .2

Would start the worker process with the correct algorithm - this is a service.

The description of what process to start with what arguments is saved into the stack file and used to deploy the service.

Services can be routers as well as workers (in fact they can be any quarry.io character).

##Resources
The job of a stack is to decide what computers to run what processes on and to request more/shutdown existing computers.

You can give a quarry.io stack 100 different services and run it on 1 computer.

You can give a quarry.io stack 1 service and run it on 100 computers.

The stack will auto-balance it's services based on load.

The stack will route messages based on it's 'Message Chain'.

A stack will allocate resources to any stacks inside of it - these stacks will organise their own (passed down) resources.