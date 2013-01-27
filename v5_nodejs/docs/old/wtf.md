#WTF?
quarry.io is a

		realtime distributed CSS driven database

You can use it to hook into the information flow of the Internet and react to
things as they happen.

###Realtime
quarry.io is active - it will generate events when things happen and you can subscribe 
to these events and react to them.

You can still ask questions in a classic database style:

	// if we have hooked up #fridge to point to a Bill Gates fridge supplier
	$quarry('beer', '#fridge').ship(function(beers){
		alert('we have ' + beers.count() + ' beers in the fridge')
	})

But quarry.io will tell you asynchronously about events:

	// subscribe to an event - in this case a beer was raided from the fridge
	// but this event will be triggered when a beer is deleted from anywhere
	// in our project
	$quarry.event('beer:deleted', function(){

		// now load up the beers in the fridge (which is where we care about)
		$quarry('beer', '#fridge').ship(function(beers){

			// if we are getting low then trigger a text message
			// we have hooked up #me to point to a web of communication for our phones and stuff
			if(beers.count()<5){
				$quarry('#me').append('sms', {
					message:'Beer is low!'
				})
			}
		})
	})

###Distributed
quarry.io deals with orchestrating databases together into a lovely soup of sense.

A single 'database' can be one of the many different suppliers:

	QuarryDB
	Mongo
	MySQL
	Postgre
	Flickr
	Facebook
	Twitter
	Nasdaq
	Google Search/Maps/Plus
	Twilo
	Wikipedia
	etc
	etc

A quarry.io projects lets you create connections to the above sources and tag them.

Using a context search you can then trigger branching selectors:

	// we have hooked up Facebook, Linkedin and Twitter suppliers to have a .socialnetwork classname
	$quarry('friend', '.socialnetwork').ship(function(friends){

		// friends is now a merge of 3 different databases
	})

The Warehouse pattern means that the context '.socialnetwork' is run first.

Each result is then converted if it actually points to a different data source.

The selector 'friend' is then run through each data source in parallel and the results merged.

###CSS Driven
quarry.io uses CSS selectors as it's core database language.

CSS is a really powerful database language, it's just the world has not realised it yet : )

You can filter by attribute:

SQL:

	select * from product where price < 100

CSS:

	product[price<100]

You can combine attribute filters with tree based queries:

SQL:

	select caption.*
	from caption, product
	where caption.product_id = product.id
	and product.price<100
	group by caption.id
		
CSS:

	product[price<100] caption

You can combine several queries in one and merge the results:

SQL:

	select product.*
	from product, caption
	where (
		caption.rating='good'
		and
		product.price<50
	)
	or
	(
		product.price>100
		and
		caption.rating='poor'
	)
		
CSS:

	caption.good < product[price<50], caption.poor < product[price>100]

