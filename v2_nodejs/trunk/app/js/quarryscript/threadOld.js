/*
 * @class 		quarryscript.sandboxloader
 * @filename   	quarryscript/sandboxloader.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * 
 * the entry point for the require js sandbox crusher
 * this will expose a _loader function to the main context
 *
 *
 *
 */

// we have a _globalContext which we can expose on

require([

	'quarryscript/shim',
	
	'async',
	
	'jason',
	
	'underscore',
	
	'quarryscript/htmlparser',

	'quarryscript/sandbox'
	
], function(

	shim,
	
	async,
	
	JASON,
	
	_,
	
	htmlparserClass,
	
	sandboxFactory
	
) {
	
	if(!context) { context = this; }
	
	var htmlParser = htmlparserClass.factory();
	
	var _log = function(st) {
		context.thread.emit('log', st);
	};
	
	// the function to run when the current script execution is finished
	var currentScriptCallback = null;
	
	// global id tracker for rpc requests (internal to the thread - only transported by the pool)
	var requestId = 0;
	
	// map of the request id onto the function to run when we get a response
	var requestCallbacks = {};
	
	// called each time before a new document is parsed - should get rid of any remenants of the last doc
	var resetDocument = function() {
		requestCallbacks = {};
	};
	
	var checkScriptHasFinished = function() {
		// if we have no callbacks registered - we deem the script to be finished
		if(_.keys(requestCallbacks).length<=0 && currentScriptCallback) {
			currentScriptCallback.apply({}, []);
		}
	};
	
	// the proxy to the outside world
	var rpcFunction = function(options, returnCallback) {
		
		var requestId = requestId++;
			
		requestCallbacks[requestId] = returnCallback;
			
		context.thread.emit('rpcRequest', options.document_id, requestId, options.name, JSON.stringify(options.request));
	};
	
	// we have an answer back for a request
	var rpcResponse = function(documentId, requestId, responseString) {
		
		_log('RPC response');
		
		var response = JSON.parse(responseString);		
		
		var callbackFunction = requestCallbacks[requestId];
		
		callbackFunction.apply({}, [response]);
		
		delete(requestCallbacks[requestId]);
		
		checkScriptHasFinished();
		
		_log('after finish');
	};
	
	
	
	// wrapper for when there is an error - makes a patient object to send back to the pool
	var errorHandler = function(documentId, exception, message, patient) {
		
		// if we are in the doctor - throw the exception for it to work out
		if(context.isDoctor) {
			throw exception;
		}
		// otherwise - give this script to the doctor
		else {
			//context.thread.emit('log', 'SENDING ERROR');
			// send a parse document pateient
			context.thread.emit('error', documentId, JSON.stringify({
				message:message,
				exception:("" + exception),
				patient:patient ? patient : ''
			}));
		}
	};
	
	// try to parse a document - trigger a doctor error is there is one
	var parseDocumentHandler = function(documentId, source, finishedCallback) {
		
		// make sure we tidy up
		resetDocument();
		
		try {
			htmlParser.parse(documentId, source, finishedCallback);
		} catch (exception) {
			// send a parse document pateient
			errorHandler(documentId, exception, 'Error parsing document', {
				documentSource:source
			});
		}
	};
	
	// run a single script
	var runScriptHandler = function(document, script, sandbox, finishedCallback) {
		
		var evilScript = script.text;
		
		// create the 'I have finished' function
		currentScriptCallback = function() {
			
			_log('finished');
			_log(sandbox._getOutput());
			
			script.output = sandbox._getOutput();
		
			finishedCallback();
		};
		
		// so - lets try this thing
		try {
			
			// we pass the execution off to the sandbox
			// the try block catches the error and passes it to the doctor
			sandbox._run(evilScript);
			
			_log('first run');
			_log(sandbox._getOutput());
		} catch (exception) {
			// send a parse document pateient
			errorHandler(document.id(), exception, 'Error running script', {
				documentSource:document.source(),
				sickCode:evilScript
			});
			return;
		}
		
		// check if there are not any pending requests we have finished
		checkScriptHasFinished();
		
	};
	
	
	// run the scripts that the parser found in the document
	var runScriptsHandler = function(document, sandbox, finishedCallback) {
		
		// we now have a processed document - time to run those scripts!
		async.forEachSeries(document.scripts(), function(script, nextScriptCallback) {
			
			runScriptHandler(document, script, sandbox, nextScriptCallback);
			
		}, function(error) {
			finishedCallback(error, document);	
		});
		
	};
	
	// just parse the document - don't run all the scripts
	var parseDoctorScript = function(documentId, documentSource, evilCodeFunction) {
		async.waterfall([
		
			// first off - lets try parsing the document
			function(next) {
				parseDocumentHandler(documentId, documentSource, next);
			},
			
			// if that succeeded - lets try making a new sandbox for the
			// scripts to run with
			function(document, next) {
				
				// setup the sandbox with the document and the rpc function closure
				var sandbox = sandboxFactory(document, rpcFactory(document.id()));
				
				next(null, document, sandbox);
				
			},
			
			// if that succeeded - lets try making a new sandbox for the
			// scripts to run with
			function(document, sandbox, next) {
				
				// the sick code has been embedded into the document
				sandbox._run();
				
			}
			
		], function() {
			
			// we don't do anything here - the thread is listening for the above event
			//console.log('we made it passed the doctor ok');
		});
	}
	
	// the parse document entry point
	var parseRequest = function(documentId, source) {
		async.waterfall([
		
			// first off - lets try parsing the document
			function(next) {
				parseDocumentHandler(documentId, source, next);
			},
			
			// now we have the document parsed - lets run the scripts
			function(document, sandbox, next) {
				runScriptsHandler(document, next);
			},
			
			// we have run all the scripts - render the document and return the result
			function(document, next) {
				next(null, document.render());
			}
			
		], function(error, result) {
			
			// we are all parsed and done - result should be the parsing result from the document as text
			context.thread.emit('documentParsed', documentId, result);
		});
	};
	
	// the run document entry point
	var runRequest = function(documentId, source) {
		
		//wrap the sourcecode into a single script tag and then run it as a document
		source = '<script type="quarry">' + source + '</script>';
		
		parseRequest(documentId, source);
	};
	
	// setup the document parsing listener
	// if this is triggered then this thread is safely allocated from the pool
	context.thread.on('parseDocument', function(documentId, source, parseMode) {
		
		if(parseMode=='parse') {
			parseRequest(documentId, source);
		} else {
			runRequest(documentId, source);
		}
		
	});
	
	// setup the document parsing listener
	// if this is triggered then this thread is safely allocated from the pool
	context.thread.on('rpcResponse', rpcResponse);
	
	
	// DOCTOR API
	context.thread.on('parseDoctorDocument', parseDoctorScript);

	
	context.thread.emit('booted');

	
	
});

