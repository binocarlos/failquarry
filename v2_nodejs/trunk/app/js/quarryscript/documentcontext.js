/*
 * @class 		quarryscript.connector
 * @filename   	quarryscript/connector.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * 
 * looks after running RPC requests on behalf of a document
 * 
 *
 *
 */

define([

	'underscore',

	'async'
	
], function(

	_,
	
	async
	
) {
	
	if(!context) { context = this; }
	
	
	// this is called for each document
	var context = function(document) {
		
		// RPC callback functions by their ids
		var connectorCallbacks = {};
	
		// incrementing request id - used to track requests for documents
		var nextRequestId = 0;
	
		context.thread.removeAllListeners('rpcResponse');
		
		var requestFunction = function(request, callback) {
			var request_id = nextRequestId++;
			var document_id = document.id;
			
			connectorCallbacks[request_id] = callback;
			
			context.thread.emit('rpcRequest', document_id, request_id, JSON.stringify(request));
		};
		
		var responseFunction = function(document_id, request_id, rawResponse) {
			var response = JSON.parse(rawResponse);
			
			
		};
		context.thread.on('rpcResponse', function(responseString) {
			
			
		
		
		});
		
		// we return the connector function
		return function(request, callback) {
			var request_id = nextRequestId++;
			var document_id = document.id;
			
			connectorCallbacks[request_id] = callback;
			
			context.thread.emit('rpcRequest', document_id, request_id, JSON.stringify(request));
		}
	
		this.request = function(options) {
			
		};
		
		
		// the string that gets appended to
		var _output = '';
		
		var $log = sandboxClosure('log', this);
		
		var $print = function(st) {
			
		};
		
		
		// this is called for every new script block
		return function(code, completedCallback) {
			
			_output = '';
		
			// DO NOT MESS WITH THIS BIT
			//DOCTOR
			eval(code);
			//DOCTOR
			
		};
	};
	
	var factory = function(document) {
		return new connector(document);
	};
	
	return factory;
	
	
});