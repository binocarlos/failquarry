#Pointers
An array of container/warehouse routing instructions for a container to find itself back where it came from.

When a container is loaded several layers deep - it travels through each stage to arrive at the browser:

		warehouse('friend', '.socialnetwork').when(function(results){

		})

The example above from the browser:

 1. request is sent to the browser warehouse - which adds it's id onto the pointer array
    (this is how the socket server can know who is asking the question - the client warehouse
    id is the id of the user)

 2. arrives at socket server with client warehouse id - socket server decides which server
    side warehouse to route to

 3. server side warehouse gets message - appends it's id onto pointer array

 4. server side runs the context selector against it's root supplier and gets JSON results

 5. each of the raw JSON results now contain a pointer to the top-level warehouse and the id within

 5. server side runs middleware stack for context results

 6. for raw results that are suppliers - a new warehouse pointing to that supplier is created

 7. anything loaded from this 2nd-layer warehouse will have the 2nd-layer id appended onto the pointer array
    (it's a 2 step pointer now)
 		
 7. the context containers are then looped and the selector run against them

 8. for normal containers - this results in a sub-search within the root supplier - 1 step pointer comes out

 9. for mapped supplier containers - the new warehouse is passed the selector - the results have a 2 step pointer

So the 2 pointer arrays:

		// this is for a normal load
		[BROWSER WAREHOUSE ID, SERVER WAREHOUSE ID, CONTAINER ID]

		// this is for a 2 step load
		[BROWSER WAREHOUSE ID, SERVER WAREHOUSE ID, SUPPLIER ID, CONTAINER ID]
