/*
 * @class quarry.contract.suppliercontract
 * @extends base
 * @filename   	quarry/contract/suppliercontract.js
 * @package    	quarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * A suppliercontract is an array of selectors aimed at one supplier
 *
 * Each selector might have a different drive but it has been determined that the drives are all belonging
 * to the same supplier (i.e. the supplier for this contract)
 *
 * The basic job of the warehouse is to take a customer contract (the front ended request) and split it
 * into a list of supplier contracts, each of which will be sent to the respective supplier to fulfill.
 *
 * Because a suppliercontract contains multiple selectors - we are efficient - i.e. we don't create 3 requests
 * to the same supplier because a customer contract has 3 selectors all for the same supplier
 *
 * 
 * 
 *
 */

define([

	'base',
	
	'underscore',
	
	'async',
	
	'system',
	
	'robject'
	
	
], function(

	base,
	
	_,
	
	async,
	
	systemClass,
	
	robject
	
) {
	
	var system = systemClass.instance();
	
	var supplierContractClass = base.extend({
		factory: function(options) {
			return new this.prototype.constructor(options);
		}
	},{
		// a pointer to the supplier that will fulfill this contract
		_drive:null,
		
		_selectors:[],
		
		init:function(options) {
			this._drive = options.drive;
			this._selectors = options.selectors;
		},
		
		drive: function() {
			return this._drive;
		},
		
		selectors: function() {
			return this._selectors;
		}
		
		
		
	});
	
	return supplierContractClass;
	
});