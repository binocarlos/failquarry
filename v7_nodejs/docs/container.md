#Containers
Lets create a container using the quarry API:

	var container = $quarry.create('product', {
		name:'Popcorn Flavours',
		size:45
	}).addClass('onsale').id('popcorn')

This has made a product container - lets have a look inside it:

	// dump the raw model data to the console
	console.dir(container.toJSON());

	// the above is the same as
	console.dir(container.models);

This will output the following data to the console:

	{
		meta:{
			tagname:'product',
			id:'popcorn',
			classnames:['onsale'],
			quarryid:'45483483443843'
		},
		attr:{
			name:'Popcorn Flavours',
			size:45
		},
		children:[]
	}

This tells us that we could match the container with the following selectors:

 * tagname: product

 * id: #popcorn

 * classname: .onsale

 * attr: [name^=p] - [size<50]

 * quarryid: =45483483443843

###Attributes
The attributes of a model is the actual data and how to use 

###Meta Data
The meta data is where the system level data lives.

It is seperated from the attributes to keep them clean and tidy.



##Containers are lists of models
When you ask suppliers for data - they are likely to return multiple things.

The same is true when you ask jQuery to resolve a CSS selector - there are likely multiple results back from the DOM.

A quarry container mitigates this the same way as jQuery - the result set is always an array.

Let up







Regardless of the type of supplier it is (Facebook, Mongo, CSV, MySQL) - they will all return your data in container format.

You can think of each supplier like a language translator - on one side they speak 'container' and on the other side they speak whatever native format the database wants to speak.

Because all suppliers speak in container format - we can link them, merge them and generally have fun with them.

Let's dig a little deeper into what the format looks like:

##Container Format
Here is an example of the simplest container:

	[]

##It's job
The role of a container is just to WRAP the raw data you see above.

In many computer systems the idea is to create 'new' objects using the data you see above.

quarry.io NEVER does this.

Just like jQuery - the container leaves the underlying model data (e.g. the DOM) the heck alone.

Can you imagine the drama if jQuery tried injecting functions onto raw DOM elements to make it's magic happen!

The same principle applies to containers - they just wrap the raw data underneath.

Right - enough container theory - lets have some practice.

##Creating a new container.
