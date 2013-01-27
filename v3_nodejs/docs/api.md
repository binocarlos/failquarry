Quarry:

  // this returns a warehouse container (a normal container wrapped with warehouse middleware)
  var myQuarry = jquarry({... config});

Supplier:

  // this returns an container wrapping a supplier object (so it can be appended to other containers)
  var supplier = jquarry.quarrydb({... config});

Adding a supplier to a quarry:

  // we can append the supplier to the quarry (because the quarry and supplier are just containers)



Returns Warehouse:

  // give the suppliers container
  .suppliers(container)