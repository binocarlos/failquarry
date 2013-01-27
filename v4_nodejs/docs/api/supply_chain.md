#Supply Chain
This is just an entry function that accepts a message.

The basic message format:

	{
		action:'select',
		message:{

		},
		answer:{
			ok:true,
			results:...
		}
	}

There are main methods a supply chain must support:

##contract

 * selector - the selector stage string (product[price<100] > img)

 * context - the context stage string (.shop)

 * previous - the last data to match, use this to search 'from'

This is the context and selector together in one hit.

This message is triggered from the Query at the bottom of container.js

	{
		action:'contract',
		message:{
			selector:'product.onsale[price<100]',
			context:'#shop',
			previous:[
				// quarryids or skeletons
			]
		},
		answer:{
			ok:true,
			results:[
				// raw container data
			]
		}

	}

##select

 * selector - the selector stage string (product[price<100] > img)

 * previous - the last data to match, use this to search 'from'

A single selector - should loop over stages - this can accept previous ids.

	{
		action:'select',
		message:{
			selector:'product.onsale[price<100] > img',
			previous:[
				// quarryids or skeletons
			]
		},
		answer:{
			ok:true,
			results:[
				// raw container data
			]
		}
	}

##select_stage

 * selector - the selector stage string (product[price<100])

 * skeleton - whether we just want _meta data or the whole data

 * previous - the last data to match, use this to search 'from'

A single stage - can accept previous ids

	{
		action:'select_stage',
		message:{
			selector:'product.onsale[price<100]',
			skeleton:true,
			previous:[
				// quarryids or skeletons
			]
		},
		answer:{
			ok:true,
			results:[
				// raw container data
			]
		}
	}

##append

 * pointer - the skeleton of the container to which you are appending

 * append - an array or single raw container object to append

Add container data onto an existing container.

	{
    action:'append',
    message:{
      target:skeleton,
      append:[
      	// an array or object of raw container data
      ]
    },
		answer:{
			ok:true
		}
  }