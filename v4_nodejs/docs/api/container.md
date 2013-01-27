#Container
The core data structure of a database record.

The job of supply chains is to work with this data structure
and convert it behind the scenes.

The basic container format:

	{
		name:'hello',
		price:100,
		other:'attr here',
		_meta:{
			id:'#id',
			tagname:'type',
			quarryid:'=quarryid',
			classnames:{
				classname:true
			}
		},
		_data:{
			// temporary storage - never saved
			// ...
		},
		_children:[
			// array of raw container data as children
		]
	}

