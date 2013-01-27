#Messages
The system system is strung together by the messages and their schema.

It matters not what the code does, what class you write even what language it's in.

What matters is that the code you write follows the rules for the message format.

##Contract
A contract message means 'please can you resolve and execute this sequence of actions'.

The result of a contract message might by 'OK'

Equally it might be BASE64 or container data.

The headers in the response will tell you what the answer is.

A contract consists of a top-level block.

Each block can be 'merge' or 'pipe'.

Each block has an 'actions' array.

Merge will run each action in parallel and concat the results into a final array.

Pipe will run each action in sequence and pass the previous results onto the next.

Both action typs will produce a result - this might be used by the containing action type.

		{
			type:'pipe',
			packets:[{
				type:'merge',
				packets:[packetA, packetB]
			},{
				type:'merge',
				packets:[packetC]
			}]
		}

In the example above - the results of the first pipe (a merge of it's own) are passed to the second pipe

This is typical of a context search in a warehouse.

I.e.:

		$quarry('product.onsale[price<100] > caption', '.shop')

Turns into:

	{
		type:'pipe',
		packets:[{
			req:{
				headers:{
					path:'/select'
				},
				body:[.shop selector]
			}
		},{
			req:{
				headers:{
					path:'/select'
				},
				body:[product.onsale[price<100] > caption selector]
			}
		}]
	}

Which ends up with the 2nd /select getting the results from the first /select to work with

If the above was a merge - they would both happen in parallel and the results, well, merged.

