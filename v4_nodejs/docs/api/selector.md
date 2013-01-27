#Selector
The selector is a message format that describes a css seletor.

When you say:

		product.onsale[price<100] > img.large, blog:recent

It turns into:

[
	[
		{
			tagname:'product',
			classnames:{
				onsale:true
			},
			attr:[{
				field:'price',
				operator:'<',
				value:100
			}]
		},
		{
			tagname:'img',
			classnames:{
				large:true
			},
			splitter:'>'
		}
	],

	[
		{
			tagname:'blog',
			modifier:{
				recent:true
			}
		}
	]

]

There is an array of phases - each phase is an array of stages, each stage is an object.