Network - top level

	Infrastructure - hardware

		Instance - computer

	StackContainer - the stacks we run

		Stack - user folder

			CONFIG
			---------------------------------------------------------
			Service - FILES - what the user has configured to happen
			---------------------------------------------------------
			API - config (limits / deploy strategy etc)

				Endpoint - a single API worker description

			Webserver - config

				Website - a single website that will be mapped onto endpoints in the API

			Reception - config

				Middleware - things ALL requests run via
			---------------------------------------------------------

			RESOURCES
			---------------------------------------------------------
			Worker - PROCESS - what workers we have to put our services onto
			---------------------------------------------------------
			
				this is a process running on an instance that is hooked
				up to the system database

				as soon as services are added to the worker - they will spawn
				nodes that are running code configured to connect to the network

				the only role of the worker is to boot and kill nodes when the system
				has asked

			DEPLOYMENT
			---------------------------------------------------------
			Node - SOCKET - what services are running on what workers as nodes
			---------------------------------------------------------
				this is the code that will run as per the container boot-config
				that has come from the service

				a node is what understands services and the code needed to get them running

				the addition of a node to a worker is what get's it up and running

				the worker will listen for the deletion of the node in order to shut it down



stack jobs
----------

1. build/kill worker processes
2. emit infrastructure events (like 'more servers please')
3. monitor the worker processes
4. allocate services onto workers (by creating nodes)
5. change the allocation of services