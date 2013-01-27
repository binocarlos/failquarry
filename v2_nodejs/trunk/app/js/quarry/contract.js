/*
 * @class quarry.contract
 * @extends base
 * @filename   	quarry/contract.js
 * @package    	quarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * contract
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
	
	'./contract/suppliercontract'
	
	
], function(

	base,
	
	_,
	
	async,
	
	robject,
	
	systemClass,
	
	supplierContractClass
	
) {
	
	var system = systemClass.instance();
	
	var chunkerParts = [
												
		'(\\w+:(\\w+:)?\\/)', 		// drive location
		
		'|',						// OR
		
		'(',						// selector grouper
																		
			'([\\w]+)',				// type (1 or none)
			
			'|',						// OR
													
			'(\\#\\w+)',				// id (1 or none)
			
			'|',						// OR
													
			'([\\.\\w]+)+',				// class (many or none)
			
			'|',						// OR
													
			'(\\[[\\w\\W]*?\\])+',	// attribute (many or none)
			
			'|',						// OR
													
			'(:[^\\s]+)+',				// modifier (many or none)
			
		
		')',						// selector grouper - this means we must have at least one of the last lot
												
		'|',						// OR
												
		'([\\*])',					// special selectors
									// * = all items
																		
		'|', 						// OR
																		
																		
		'([ ,<>]+)'					// splitters (>> > << < ,) - this splits stages (>,<) or phases (,)
		
	];
	
	// map of match positions against fieldnames
	var chunkMap = {
		'drive':1,
		'itemtype':4,
		'id':5,
		'classnames':6,
		'attributes':7,
		'modifiers':8,
		'special':9,
		'splitter':10
	};
	
	var chunker = new RegExp(chunkerParts.join(''), 'i');
	
	var phaseSplitter = new RegExp(/\s*,\s*/);
	
	var childSplitter = new RegExp(/\s*>\s*/);
	
	var descendantSplitter = new RegExp(/\s+/);

	var contractClass = base.extend({
		
	},{
		
		// the selector for the contract
		_selector:null,
		
		// the context of the contract
		_context:null,
		
		// the drives this contract can access
		_drives:{},
		
		// the chunker fills this up ready to be resolved
		_chunks:[],
		
		// the array of supplier contract we have ended up with
		_supplierContracts:[],
		
		init:function() {
			
		},
		
		selector: function() {
			return this._selector;
		},
		
		context: function() {
			return this._context;
		},
		
		drives: function() {
			return this._drives;
		},
		
		supplierContracts: function() {
			return this._supplierContracts;
		},
		
		/*
		 * the contract processing is here - it works out what suppliers are needed and gets a mini contract ready for each of them
		 * the mini contracts will not have process called on them - they will just be filled with correct data
		 */
		process:function(options, processedCallback) {
			
			var contract = this;
			
			contract._selector = options.selector;
			contract._context = options.context;
			contract._drives = options.drives;
			
			var lastMatch = [];
			
			var workingSelector = options.selector;
			
			// a sanity check
			var lastSelector = '';
			
			var currentSupplierContractData = null;
			var currentSelector = {};
			var supplierContractDataArray = [];
			
			async.whilst(
			    function () {
			    	
			    	// sanity
			    	if(workingSelector==lastSelector) { return false; }
			    	
			    	return lastMatch = workingSelector.match(chunker);
			    },
			    function (nextChunkCallback) {
			    	
			    	// sanity
			    	lastSelector = workingSelector;
			    	
			    	// add the chunk
			    	var info = contract.processChunk(lastMatch);
			    	
			    	workingSelector = workingSelector.replace(lastMatch[0], '');
			    	
			    	// if there is no info move on
			    	if(!info.field) {
			        	nextChunkCallback();
			        }
			        
			        // if there is a drive or no current supplier contract it means we are starting another selector
			        if(currentSupplierContractData==null) {
			        	
			        	currentSupplierContractData = {
			        		drive:info.field=='drive' ? info.value : null,
			        		selectors:[]
			        	};
			        	
			        	supplierContractDataArray.push(currentSupplierContractData);
			        	
			        	// reset the selector because we have a new phase
			        	currentSelector = {};
			        	
			        	if(info.field!='drive') {
			        		currentSelector[info.field] = info.value;
			        	}
			        	
			        	currentSupplierContractData.selectors.push(currentSelector);
			        }
			        // if there is a phase splitter then reset the supplier contract so the next phase can start another
			        // (which might be the same contract but resetting gives it a chance
			        else if(info.field=='splitter' && info.value.match(/,/)) {
			        	currentSupplierContractData = null;
			        	currentSelector = null;
			        }
			        // we have a selector splitter
			        // add the splitter to the current selector so it knows how to fetch children
			        else if(info.field=='splitter') {
			        	currentSelector[info.field] = info.value;
			        	currentSelector = {};
			        	currentSupplierContractData.selectors.push(currentSelector);
			        }
			        // otherwise we just add the chunk to the current supplier contract and let it work things out
			        else {
			        	currentSelector[info.field] = info.value;
			        }
			        
			        nextChunkCallback();
			        
			    },function(error) {
			    	
			    	// now we have an array of raw selectors - we can form the suppliercontracts
			    	async.forEachSeries(supplierContractDataArray, function(supplierContractData, nextContractCallback) {
			    		
			    		var supplierContract = supplierContractClass.factory(supplierContractData);
			    		
			    		contract._supplierContracts.push(supplierContract);
			    		
			    		nextContractCallback();
			    		
			    	}, function(error) {
			    		
			    		// we now have an array of supplier contracts and the contract is ready for the warehouse to inspect
			    		processedCallback(null, contract);
			    		
			    	});
			    }
			    
			);
			
		},
		
		/*
		 * we have found a chunk - process it and return the field, value object
		 * also remove the chunk from the overall query
		 */
		processChunk: function(chunkArray) {
			
			console.log('adding chunk:' + chunkArray);
			
			var fullMatch = chunkArray[0];
			var field = null;
			var value = null;
			
			var contract = this;
			
			for(var testField in chunkMap) {
				var fieldIndex = chunkMap[testField];
				
				if(chunkArray[fieldIndex]!=null) {
					field = testField;
					value = chunkArray[fieldIndex]; 
					break;	
				}
			}
			
			return {
				field:field,
				value:value	
			}
		},
		
		resolveChunks: function(resolvedCallback) {
			console.log(this._chunks);
		},
		
		isPhaseSplitter: function(chunk) {
			return chunk.match(phaseSplitter);
		},
		
		isChildSplitter: function(chunk) {
			return chunk.match(childSplitter);
		},
		
		isDescendantSplitter: function(chunk) {
			return chunk.match(descendantSplitter);
		}
	});
	
	var factoryFunction = function(options, callback) {
		var contract = new contractClass();
		
		contract.process(options, callback);
	};
	
	return factoryFunction;
	
});