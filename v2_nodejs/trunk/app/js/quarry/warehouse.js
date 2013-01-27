/*
 * @class quarry.warehouse
 * @extends base
 * @filename   	quarry/warehouse.js
 * @package    	quarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * warehouse
 *
 * 
 * 
 *
 */

define([

	'base',
	
	'underscore',
	
	'async',
	
	'robject',
	
	'system',
	
	'./supplier',
	
	'./contract',
	
	'./container'
	
	
], function(

	base,
	
	_,
	
	async,
	
	robject,
	
	systemClass,
	
	supplierClass,
	
	contractFactory,
	
	containerClass
	
) {
	
	var system = systemClass.instance();
	
	// the singleton bootstrap for the server system
	function bootstrapWarehouse()
	{
		var _instance;
		
		 return {
	        instance: function (config) {
	        
	        	 if(_instance==null) {
	        	 	
	        	 	_instance = new warehouseClass(config);
	        	 	
	        	 }
	        	 
	        	 return _instance;
	        	
	        }
	    };
	}
	
	var warehouseClass = base.extend({
		
	},{
		_config:null,
		
		init:function(config) {
			this._config = robject.factory(config);
		},
		
		/*
		 * Main warehouse entry method - selectors are given, containers are returned
		 * Note - the customers container has already been returned and is working with promises
		 * The warehouse's job is to get the actual container filled with elements ready
		 *
		 * contractOptions:
		 *		* selector - string or object config
		 *		* context - string or object config
		 *		* drives - object map of drives available
		 */
		fulfillContract:function(contractOptions, finishedCallback) {
			
			var warehouse = this;
			
			var drives = contractOptions.drives;
			
			async.waterfall([
			
				// first build the contract
				function(next) {
					contractFactory(contractOptions, function(error, contract) {	
						next(null, contract);
					});
				},
				
				// now we need to resolve the suppliers from the drive names on the contracts
				function(contract, next) {
					
					// a map of supplier name onto an array of supplier contracts for them
					var supplierContractMap = {};
					
					async.forEachSeries(contract.supplierContracts(), function(supplierContract, nextSupplierContract) {
						
						// load the supplier instance for this drive name
						supplierClass.factory(supplierContract.drive(), drives, function(error, supplier) {
							if(error || !supplier) {
								finishedCallback(supplierContract.drive() + ' is not a valid drive name');
								return;
							}
							
							// now we have the supplier - add the contract to it's map
							if(!supplierContractMap[supplier.name()]) {
								supplierContractMap[supplier.name()] = {
									supplier:supplier,
									contracts:[]
								};
							}
							
							supplierContractMap[supplier.name()].contracts.push(supplierContract);
							
							nextSupplierContract();
						});
						
					}, function(error) {
						// we now have the supplier contracts as a map
						next(null, supplierContractMap);
					});
				},
				
				// now we send the supplier contracts to each supplier and wait for an answer
				function(supplierContractMap, next) {
					
					var masterContainer = containerClass.factory();
					
					// this runs in parallel
					async.forEach(_.keys(supplierContractMap), function(supplierName, supplierFinishedCallback) {
						var supplierInfo = supplierContractMap[supplierName];
						var supplier = supplierInfo.supplier;
						var contracts = supplierInfo.contracts;
						
						// give the contracts to the supplier to fulfill
						supplier.fulfillContracts(contracts, function(error, supplierContainer) {
							// we now have a container back from the supplier filled with elements
							// add it to the map and tell async we are done
							supplierContainer.pourInto(masterContainer);
							
							supplierFinishedCallback();
						});
						
					}, function(error) {
						
						// we now have the master container filled by the suppliers
						// pass it on
						next(null, masterContainer);
						
					});
				}
				
			], function(error, container) {
				finishedCallback(null, container);
			});
		}
	});
	
	return bootstrapWarehouse();
	
});