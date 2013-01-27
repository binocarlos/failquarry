/*!
 * JQuarry node.js library
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var containerFactory = require('./container'),
    contractFactory = require('./legal/contract'),
    supplierFactory = require('./supplier/factory'),
    warehouseFactory = require('./warehouse'),
    serverFactory = require('./server'),
		_ = require('underscore');

// expose createModule() as the module
exports = module.exports = jQuarry;

/**
 * Framework version.
 */

exports.version = '0.0.1';

// quasi value for external suppliers to check that they have been passed a proper jquarry
exports._jquarry_version = exports.version;

/**
 * The front door entry point that is just a proxy to create a new container
 *
 * @api public
 */

function jQuarry() {

  return containerFactory.apply(this, _.toArray(arguments));
}

/**
 * expose the container factory
 */

jQuarry.container = containerFactory;

/**
 * expose the contract factory
 */
 
jQuarry.contract = contractFactory;

/**
 * expose the supplier factory
 */

jQuarry.supplier = supplierFactory;

/**
 * expose the warehouse factory
 */

jQuarry.warehouse = warehouseFactory;

/**
 * expose the mount express function
 */

jQuarry.bind = serverFactory;

