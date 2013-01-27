#Contract
A simple json message that instructs a supplier to do something.

The 'action' property tells the supplier what to do.

##Select
Reduce a selector

	{

		// must be 'select'
		action:'select',

		// do we want full data or just ids?
		// co-ordinated by the supply_chain
		phase:'full' | 'skeleton',

		// what is the selector we are running
		selector:{
			id:..,
			classnames:{},
			attr:...
		},

		// what is the context for this selector (i.e. previous ids)
		context:[...]
	}

context is an array of the previous data - this can be:

 * string = quarryid of the previous match
 * object = _meta.quarryid skeleton of the previous match
 * object = the whole (ram supplier) previous match

