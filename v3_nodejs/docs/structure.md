# jQuarry Design

This is a quick sketch:

## Create a quarry

The first thing to do is make a new quarry, this represents a collection of databases.

To populate a single quarry with databases - you have to add **suppliers**.

You create suppliers and pass them to your quarry via a **mount-point**.

The mount point is referenced by the **selector**:

  warehouse('product', 'shop').each(function(){..})

Says load me **products** from the **shop** supplier.

The shop supplier is mounted like this:

  var shop = jquarry.quarrydb({..access details here..});

  // make a new quarry with a config
  var myQuarry = jquarry();

  myQuarry.supplier('shop', shop);
    
Once the selector is run - the **contract** is parsed.

The contract has several **phases** - each phase is assigned a drive.

The drive is used as a selector against the supplier CSS entries to match.

Once there is a supplier per phase - the contract is juggled so now we have a sequence of contracts one per supplier.

The suppliers JOB is to create **elements** out of the contract and organize the relationships of those elements.

A single element will have these key methods that are overriden by the supplier with closure functions (pointing to the internal DB).

In most cases - a supplier will delegate to the **raw** supplier which can look after the in-memory tree and search within in it
producing more containers from the results.

There are three things a supplier does for every element that comes into existence

1. Runs the element through the supplier middleware chain - this lets things from the outside change properties of the element from this supplier
2. Adds functions to the elements middleware setup - this will enable functions that trigger when the element wants to do something (this is for async stuff like save)
3. Replaces core sync functions on the element for things that need to return right away (like children)

So - each element MUST be able to stand-alone and have things like append called on it whilst looking after it's own registry.

The functions that will be worked with:

  children (sync - in memory, async - from supplier)
  descendents (sync - in memory, async - from supplier)
  ancestors (sync - in memory, async - from supplier)
  parent (sync - in memory, async - from supplier)
  append (async)
  save (async)
  delete (async)

When the warehouse is used to make a NEW element - it will not have these functions mapped by a supplier (because it is brand new).

