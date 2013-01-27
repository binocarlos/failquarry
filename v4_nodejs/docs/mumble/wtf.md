#WTF?
quarry.io is a computing platform.

In our world, computing has 3 parts:

 1. Work
 2. Information
 3. Communication

Lets break these little bits down:

##Work
This very simply means 'running code'.

If you take this function (in JavaScript):

	function add_vat(amount){
		return amount * 1.2;
	}

It will do some work.

The idea of work is to break it down into as small a part as makes sense.

You then 'communicate' 'information' to the workers (running javascript code) and it will return information back.

##Information
This very simply means 'data'.

If you take this data (in JSON):
	
	[{
		"product":"wood",
		"cost":3848.34
	},{
		"product":"glue",
		"cost":864.30
	}]

This is the cost of raw materials for some company called ACME tables.

We 'communicate' this data to a 'worker'.

The idea is to ask for data in a homogenous way - i.e. quarry.io selectors:

	.product

Would give you a list of all your products with the cost.

##Communication
This ties together 'work' and 'information' - by communicating information to workers 
and listening for the results, we can get stuff done.

If you take this topology:

                WORKER
                  ||
								ROUTER
          -----------------
          |                |
			WORKER A          WORKER B     

Then you have a worker farm - A,B could be up to several thousand

The role of the 'stack' in quarry.io is to represent a 'deployment' and route 'messages'
containing 'information' around 'workers'.

The magic of [ZeroMQ](http://www.zeromq.org/) means that deployments can be as complicated as you make them.
