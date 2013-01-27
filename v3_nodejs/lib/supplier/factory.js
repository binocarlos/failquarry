/*!
 * Jquarry: Supplier Factory
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */
var _ = require('underscore'),
containerFactory = require('../container');

var factory = function(supplierName, container, callback){
  
  container = containerFactory(container);

  console.log('making supplier');
  console.dir(container.raw());

  try{
  	var supplierFunction = require('./' + supplierName);
  	supplierFunction(container, callback);
  }
  catch (err){
  	console.log('there was a supplier error');
  	console.log(err);
  }
  
  return container;
}

module.exports = exports = factory;