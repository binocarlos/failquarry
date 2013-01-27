/*
 * @class quarry.supplier
 * @extends base
 * @filename   	quarry/supplier.js
 * @package    	quarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * supplier is what fulfills a supplier contract and fills containers with elements
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
	
	'robject',
	
	'./container'
	
	
], function(

	base,
	
	_,
	
	async,
	
	systemClass,
	
	robject,
	
	containerClass
	
) {
	
	var system = systemClass.instance();
	
	var _defaultType = 'database';
	
	var supplierConfig = {
		filesystem:{},
		database:{}
	};
	
	var _instances = {};
	
	var nameFactory = function(supplierName, callback) {
		if(_.isEmpty(supplierName) || !supplierConfig[supplierName]) {
			callback(supplierName + " is not a known supplier name");
			return;
		}
		
		if(_instances[supplierName]) {
			callback(null, _instances[supplierName]);
			return;
		}
			
		require(['quarry/supplier/' + supplierName], function(supplierClass) {
				
			callback(null, _instances[supplierName] = new supplierClass(supplierName));
		});
	};
	
	var driveFactory = function(driveName, driveMap, callback) {
		if(_.isEmpty(driveName)) {
			driveName = _defaultType;
		}
			
		driveName = driveName.replace(/:\/$/, '');
		
		nameFactory(driveMap[driveName], callback);
		
	};
	
	var supplierClass = base.extend({
		
		factory: driveFactory,
		
		instance: nameFactory
		
	},{
		_name:null,
		
		init:function(name) {
			this._name = name;
		},
		
		name:function() {
			return this._name;
		},
		
		fulfillContracts: function(contractArray, finishedCallback) {
			var container = containerClass.factory();
			
			finishedCallback(null, container);
		}
	});
	
	return supplierClass;
	
});