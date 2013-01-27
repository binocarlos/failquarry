#quarry.io
Before we dive into the useful world of nested database connections, let us
first introduce ourselves to the characters involved.

##jQuery, Backbone & CSS
These 3 culprits of any decent toolkit sit firmly at the center of the quarry.io stack.

Did you know jQuery is used on **42%** of pages on the **entire Internet!**

That is a lot of pages.

As it turns out, jQuery is a really really good database in disguise.

That is why web designers who use CSS selectors every day love it.



	div.shop > div.category[name^=a] > div.product[price<=100]

From a total mash up of HTML tags and God knows what else on the page,
Bob the humble web designer can 



We think this is because web designers mainly use JavaScript libraries and web
designers love CSS because they use it every day.

The combination of CSS selectors as a database query language and the browser's DOM
as the data source became an instant hit and jQuery destroyed all feeble pretenders 

A container wraps an array of Backbone models just like jQuery wraps
an array of raw DOM elements.

Take this very basic HTML:

	<div id="asia" class="continent">
		<div class="country" id="MA">Malaysia</div>
		<div class="country" id="IN">India</div>	
	</div>
	<div id="europe" class="continent">
		<div class="country" id="SW">Switzerland</div>
		<div class="country" id="PL">Poland</div>	
	</div>

Now, using jQUery I can 'select' all of the DOM elements representing countries in asia:

	$('div#asia > div.country').each(...)

quarry.io is based on the idea that databases come to life when you do 2 things to them:

 1. Turn them into a tree
 2. Use CSS as the main query language

