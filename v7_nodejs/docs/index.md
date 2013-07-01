#quarry.io
The aim of quarry.io is to make using databases easy.

Everyone can use and program databases - all you need is a mouse or keyboard
(depending upon your flavour) and some quarry.io sauce.

##Databases are easy! (but not at the moment)
There are many many database systems around - all of which do one fundamental
job:

 * save your data somewhere and let you ask for it later

In fact in a more general sense computer systems only really do 3 jobs:

 * save and access data (memory and storage)
 * execute code upon that data (CPU)
 * move that data around (network and bus)




Let me prove it - let's take Bob's Hardware Shop and his MySQL
database he installed in 1997 to tally up his products and sales.

When he first plugged
We want all sales for products less than £100.

###Example 1. - Bob's sales in SQL

	select
		sale.*
	from
		product, sale
	where
		product.price<100
		and
		sale.product.id = product.id
	group by
		product.id

Yay! We wrote some SQL.

Thing is - there is a different way:

###Example 2. - Bob's sales in Quarry

	product[price<100] sale

Can you see the magic trick yet?

Quarry Databases (all of them) - speak CSS selectors!


##JQuery programmers love Quarry





##Example Number 1
Bob runs a corner shop - he does very 

Databases are brilliant things - compared to an army of civil
servants all scurrying down halls looking for your paperwork,
the computers of the past 30 years have saved countless hours
of painful, manual searching.


