# Network
The network manages the physical computing instances and gets stacks
and their services running on them.

Steps:

1. slurp and create configs

2. build the instances

3. bootstrap the core system resources (database and switchboard)

4. hook up the listeners onto the core database such that we:

		a. spawn worker processes when instances are added

		b. allocate stack services when stacks are added

		c. deploy stack services once they have been allocated

5. upload the configs to the system db

6. the network is now running



the system will provide web access to the core database and switchboard

each worker has a manually created supply chain to the system database

when the system database changes - the system will emit events onto the workers
in the database.

the portals that are hooked up means the workers hear these events.


the system breathing involves events being emitted by services and workers
indicating a certain part is getting hot

extra instances are added - which triggers a cloud provision before they 
are actually added

once the instances are added - the event will trigger a further worker
spawning which will enable the top priority services to have more room

the overal picture is that by hooking up a manual portal system into
the core database we can manage our own network using the quarry







# Network
The network is the top level of any quarry.io system.

It looks after the physical computers (instances) that are available
to run the stacks that live on the network.

## System
Each system runs a system stack.

This is the central auto-managed stack that provides a database
and quarry functionality to the network itself.

It holds a QuarryDB that represents the current stacks and the current
deployment.

It also provides a user database that provides ROOT access control
(with ROOT access someone can nuke the lot)

You add stacks and change them by modifying the system stack.

The network itself listens on a portal to the system database.

## Stack Layout
The network contains the 'layout' for each stack.

This is the collection of services all mounted onto different paths.

The stack layout is the main building tool for quarry.io services.

You can create as many of the various services as you want and mount
them in your own layout.

## Stack Deployment
Seperate to the layout is the 'deployment'.

This represents where the various services within a stack are to be run
and looks after routing requests to the various bits.

It is the job of the network to turn a stack layout into a deployment.

Deployments are fluid and can change both by manual user intervention
or by the webscaler issuing commands.

The network will listen to each deployment portal for these events
and will do the manual labour of creating and removing instances.

## Network Flavours
Each network is run in different modes - at present there are 3:

### Development
This is a whole network run within a single process.

This is very useful for debugging because every console.log from all of the 
stack services will be output to the same STDOUT.

When you are developing code for a quarry system, the development mode is what
you would run.

It auto-detects changes to code files and reboots accordingly - the development
network communicates over ZeroMQ icp:///tmp/quarry.io/* sockets

### Standalone
This is a whole network running on a single physical server.

This is suitable for deployment a small scale setup on a single box.

It is run as lots of long-lived (i.e. automatically restarting) processes
and communicates over ZeroMQ tcp://127.0.0.1 sockets

### Cloud
The network is now the bossquarry server that will run a cloud of stacks
on ever changing hardware.

It uses Salt for remote execution on nodes.

It connects to Rackspace et all for provisioning of new nodes.

## Services
Every network runs the following services:

### HTTP gateway
This is the front door HTTP proxy for the whole network.

There can be several of these and the DNS becomes the load-balancer.

Each HTTP gateway is able to translate requests onto their respective
stacks gateways for routing.

### Stack gateway
This is the front door RPC/HTTP proxy for a single stack.

It holds onto the supplychains connecting to each endpoint.

### Stack switchboard
The pub/sub server for a given stack.

Every endpoint will publish to here.

Every portal (internal or external) will connect to here.

### Endpoint
A generic wrapper for a worker service.

Each endpoint will have a path in a stack and will be 'mounted'
onto the stack tree.

### Webserver
A container for virtully hosted websites.

This is basically a HTTP router and Express App container.

### Webserver
A single website that is exposed to the front-end HTTP gateway on the front
and the Stack gateway on the back.


