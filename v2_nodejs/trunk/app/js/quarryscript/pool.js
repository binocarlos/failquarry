/*
 * @class quarryscript.pool
 * @filename   	quarryscript/pool.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * interface to managing the threads
 *
 */

define([

	'bootlaceportals',
	
	'underscore',
	
	'async',
	
	'system',
	
	'./sandbox',
	
	'threads_a_gogo',
	
	'crusher',
	
	'doctor',
	
	'http',
	
	'./poolrequest'
	
	
], function(

	base,
	
	_,
	
	async,
	
	systemClass,
	
	sandbox,
	
	Thread,
	
	crusherClass,
	
	doctorClass,
	
	http,
	
	poolRequestFactory
	
) {
	
	var system = systemClass.instance();
	
	return base.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		
		name:'Quarry Script Pool Manager',
		
		// an array of jobs that stack up until there is a free thread
		_jobs:[],
		
		// the array of all the free threads in the pool
		_freeThreads:[],
		
		// the array of all threads in the pool
		_threads:[],
		
		// a map of threads by id
		_threadsById:{},
		
		// a map of document data by the document id
		// this has:
		//	:thread - the thread this document is occupying
		//	:status - the current status of this document
		//	:returnFunction - the function to run when the document has finished processing
		//	:timeoutId - the timeout id of this document for the infinite loop safegaurd
		_documents:{},
		
		/*
		
		// a map of threads by their document id
		_threadsByDocumentId:{},
		
		// a map of status keys by document id
		_statusByDocumentId:{},
		
		// a map of document id onto return function once processed
		_returnFunctionsByDocumentId:{},
		
		// a map of document id onto the timeout id for the function to kill the thread (infinite loop handler)
		_documentTimeoutIds:{},
		
		*/
		
		
		
		// the source code crusher
		_crusher:null,
		
		// the code to be loaded into each thread when it is born
		_sandboxcode:null,
		
		// the file path for the sandbox code - used by the doctor
		_sandboxcodePath:null,
		
		/**
		 * connect off to the rpc registry
		 */
		_registryClient:null,
		
		/**
		 * webserver config
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('quarryscript.pool');

			return ret;
			
		},
		
		/**
		 * setup up the registry client object
		 *
		 */
		getObjectSetupFunctions: function() {
			
			// get the base setup functions
			var ret = this._super();
			
			var pool = this;
			
			// load the crusher client
			pool._crusher = crusherClass.factory();
			
			// load the script doctor
			pool._doctor = doctorClass.factory();
			
			// run this once to make it quicker
			pool.processDocument = pool.processDocumentFactory();
			
			// load the registry client - we will need this to request crushes
			ret.push(function(callback) {
				
				pool.setupRegistryClient(callback);
				
			});
			
			// load the thread code
			ret.push(function(callback) {
				
				pool.loadThreadCode(callback);
				
			});
			
			// load the threads
			ret.push(function(callback) {
				
				pool.loadThreads(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * setup the website registry client
		 *
		 */
		setupRegistryClient: function(callback) {
			
			var pool = this;
			
			this.message('header', 'Loading Registry Client');
			
			require(['client/rpc/registry'], function(registryClientClass) {
				
				var client = registryClientClass.factory();
				
				client.bind('ready', function() {
					
					pool._registryClient = client;
				
					callback();
				});
								
			});
			
		},
		
		/**
		 * added to by subclasses
		 *
		 */
		getPortals: function() {
			
			var registry = this;
			var ret = this._super();
			
			var adminListenPortal = this.createPortal({
				name:'Quarry Script Pool Admin Listen Portal',
				exchange:'admin',
				// we want all admin messages - the middleware will filter them
				router:'#'
			});
			
			ret.push(adminListenPortal);
			
			adminListenPortal.use(function(message, next) {
			
				console.log('have admin message');
				
				/*
				if(message.instruction=='clearWebsiteCache') {
				
					registry.clearWebsiteCache();
					
				}
				*/
				
				next();
				
			});
			
			return ret;
			
		},
		
		
		/**
		 * use the crusher client to see if the file already exists
		 * if it does not exist - create a RPC request to crush
		 *
		 */
		getCrushCode: function(module, crushedCallback) {
			
			var registry = this._registryClient;
			
			// first lets see if the crusher client can load the crushed file from disk
			this._crusher.client(module, registry, crushedCallback);
			
		},
		
		/**
		 * setup the securityGuard
		 *
		 */
		loadThreadCode: function(callback) {
			
			var pool = this;
			
			this.message('header', 'Loading Thread Code');
			
			this.message('event', 'Thread Code', 'quarryscript/thread');
			
			// lets compress the sandbox into one chunk of code
			pool.getCrushCode('quarryscript/thread', function(error, code, codePath) {
			
				if(error) {
					console.log('error with sandbox code');
					console.log(error.message);
					return;
				}
				
				pool.assignSandboxCode(code, codePath);
				
				callback();
			
				
			});
			
		},
		
		/**
		 * sync - sets the sandbox code for the thread pool and the doctor
		 *
		 */
		assignSandboxCode: function(code, codePath) {
			var pool = this;
			
			pool._sandboxcode = code;			
			pool._sandboxcodePath = codePath;
		},
		
		/**
		 * setup the securityGuard
		 *
		 */
		loadThreads: function(loadedCallback) {
			
			var pool = this;
			
			var threadCount = pool.config('size');
			
			var n = 0;
			
			pool.message('header', 'Thread Pool: ' + threadCount + ' worker threads');
			
			async.whilst(
    			function () { return n < threadCount; },
			    function (nextThreadCallback) {
			    	pool.createThread(nextThreadCallback);
			    	n++;
			        
			    },
    			function (err) {
        			loadedCallback();
    			}
			);

		},
		
		
		/*
		 * closure to be JAZONed and evaluated in the thread to load the sandbox code
		 */
		sandboxClosure: function() {
			
			var pool = this;
			
			var closure = [
				'(function() {',
				pool._sandboxcode,
				'})()'
			].join("");
			
			return closure;
		},
		
		waitForDocument: function(document) {
			
			var pool = this;
			
			var delay = pool.config('timeout');
			
			var thread = document.thread;
			
			document.timeoutId = setTimeout(function() {
				
				system.message('flash', 'Thread Pool', 'Killing thread for timeout: ' + thread.id);
				
				document.status = 'died';
				document.output = 'Yikes! Your script has an infinite loop and has been disabled - please change it now';
				
				pool.documentComplete(document);
				
				pool.killDocument(document);
				
			}, delay);
		},
		
		heardFromDocument: function(document) {
			var pool = this;
			
			clearTimeout(document.timeoutId);
			
			document.timeoutId = null;
		},
		
		/*
		 * the thread has finished with a document and has the text result
		 */
		documentComplete: function(document) {
			
			var pool = this;
			
			// get the callback function for this document
			var callback = document.callbackFunction;
			
			// send back the page	
			callback(null, document.output);
			
			// release the thread unless we died (in which case it got killed
			if(document.status!='died') {
				pool.releaseThread(document.thread);
			}
			
			delete(pool._documents[document.id]);
		},
		
		/*
		 * creates a new thread for the pool and preloads it with code
		 */
		createThread: function(threadCreatedCallback) {
			
			var pool = this;
			
			// create the thread
			var thread = Thread.create();
			
			// setup the log event here so the boot sequence can log
			thread.on('log', function(st) {
				console.log(st);
			});
				
			// hook up the booted event so we know the thread is ready
			// this is what tells us to respond that the thread has been created
			thread.on('booted', function() {
				
				// the thread is ready now - we can continue
				pool.message('event', 'thread ' + thread.id, 'booted');
    
    			// add it to the pool
				pool.addNewThreadToPool(thread);
				
				// clear the booted event
				thread.removeAllListeners('booted');
	
				// we get a patient to give to the doctor from this
				thread.on('error', function(documentId, rawError) {
					
					var document = pool._documents[documentId];
					
					pool.heardFromDocument(document);
					
					var error = JSON.parse(rawError);
					
					var exception = ("" + error.exception);
					
					// if we have a patient - we send it to the doctor!
					if(error.patient) {
						pool.diagnose(error.patient, exception, function(error, diagnosis) {
							
							diagnosis = diagnosis.replace(/\n/g, "<br />\n");
							
							// assign the document output
							document.output = diagnosis;
							
							console.log(diagnosis);
							
							// we have the diagnosis string from the doctor - send it
							pool.documentComplete(document);
						});
					}
					// otherwise we just print the message
					else {
						document.output = error.message;
						pool.documentComplete(document);
					}
					
				});
				
				
				// setup the data request listener so we can get data for the thread scripts
				thread.on('rpcRequest', function(documentId, requestId, requestName, configString) {
					
					var document = pool._documents[documentId];
					
					// tell the pool we have heard back from this document's thread
					pool.heardFromDocument(document);
					
					document.status = 'rpc';
					
					pool.rpcRequest(document, requestName, JSON.parse(configString), function(error, result) {
						
						if(error) {
							result = error;
						}
						
						// perhaps we have died whilst waiting for this request to complete
						if(document.status=='died') {
							return;
						}
						
						// tell the pool we are going back into the thread and to start an infinite loop timer
						pool.waitForDocument(document);
						
						thread.emit('rpcResponse', documentId, requestId, JSON.stringify(result));	
					});
					
				});
				
				// called from the thread when it has determined that everything inside of it is done now
				// grab the callback function and free the thread
				thread.on('documentParsed', function(documentId, page) {
					
					var document = pool._documents[documentId];
					
					pool.heardFromDocument(document);
					
					document.output = page;
					
					pool.documentComplete(document);
					
				});
				
				// we are now booted and the thread is ready to run user scripts
				threadCreatedCallback();
				
			});
			
			pool.message('event', 'thread ' + thread.id, 'starting');
			
			var sandboxCode = pool.sandboxClosure();
			
			// now we evaluate the sandbox code - when it has finished it will emit a 'booted' event
			thread.eval(sandboxCode, function(error, result) {
				
				// we should not have an error here because the crusher would have picked it up
				if(error) {
					console.log('Error with sandbox code');
					console.log(error);
					return;	
				};
				
				// now the thread is ready - the callback is triggered above in the booted function
				
			});
			
			
		},

		/*
		 * takes a document as parsed by the processor and runs the scripts found inside of it
		 *
		 * config contains:
		 *		* source
		 *		* mode (parse|run)
		 */
		processDocumentFactory: function() {
			
			var pool = this;
			
			var nextDocumentId = 0;
				
			return function(options, processedCallback) {
				
				var source = options.source;
				var decision = options.decision;
				var profile = options.profile;
				
				var document = {
					id:nextDocumentId++,
					parseMode:decision.parse_quarry_mode,
					callbackFunction:processedCallback,
					status:'threadpool',
					timeoutId:null,
					thread:null,
					// wrap the source in a script tag if the source is pure quarry script
					source:decision.parse_quarry_mode=='run' ? '<script type="quarry">' + source + '</script>' : source,
					profile:profile,
					decision:decision,
					output:''
				};
				
				pool._documents[document.id] = document;
				
				// get a thread from the pool
				pool.ensureThread(document, function(error, thread) {
					
					// we are parsing the document now
					document.status = 'parsing';
					
					// tell the pool we are going back into the thread and to start an infinite loop timer
					pool.waitForDocument(document);
					
					// tell the thread to work it
					// we will get a 'documentParsed' - this handler is above in createThread
					thread.emit('parseDocument', document.id, document.source);
				});
				
				return document.id;
				
			};
			
			
		},
		
		/*
		 * add a new thread to the db
		 */
		addNewThreadToPool: function(thread) {
			
			var pool = this;
			
			//add it to the pool
			pool._threads.push(thread);
			pool._freeThreads.push(thread);
			pool._threadsById[thread.id] = thread;
		},
		
		/*
		 * we need a non-busy thread provided to the jobFunction
		 * if there is one free - bargain, run the jobFunction with the free thread
		 * if not - then add the job function to the queue
		 * it is up to the job function to lock the thread once its been provided (it's gotsta be this way)
		 */	
		ensureThread: function(document, jobFunction) {
			var pool = this;
			
			var jobClosure = function(error, freeThread) {
				// add the thread by the document id in case the webserver tells us to remove it
				document.thread = freeThread;
				
				jobFunction.apply({}, [null, freeThread]);
			};
			
			if(!pool.hasFreeThread()) {

				// no we are busy - so add a job onto the queue
				pool.addJobToQueue(jobClosure);
				
			} else {

				// we have a free thread - allocate it
				pool.allocateThread(jobClosure);
				
			}
			
		},
		
		/*
		 * are we maxed out at the moment?
		 */
		hasFreeThread: function() {
			return this._freeThreads.length>0;
		},
		
		/*
		 * do we have any work in the queue?
		 */
		hasJobs: function() {
			return this._jobs.length>0;
		},
		
		/*
		 * adds a function onto the end of the queue
		 * as threads become free - the first item in the queue is given the thread
		 * when this function gets to the start of the queue - it will be given a thread
		 */
		addJobToQueue: function(jobFunction) {
			this._jobs.push(jobFunction);
		},
		
		/*
		 * tiggered when there is a thread free
		 */
		runNextJob: function() {
			
			var pool = this;
			
			// there is no work to do
			if(!pool.hasJobs()) { return; }
			
			// there is no-one to do the work
			if(!pool.hasFreeThread()) { return; }
			
			// the next job to do
			var nextJob = this._jobs.shift();
			
			pool.allocateThread(nextJob);
		},
		
		/*
		 * grab the next thread that is free and allocate
		 */
		allocateThread: function(jobFunction) {
			var pool = this;
			
			if(pool._freeThreads.length<=0) {
				pool.addJobToQueue(jobFunction);
				return;
			}
			// get the free thread
			var freeThread = pool._freeThreads.shift();
			
			this.message('event', 'taking thread', freeThread.id);
			//console.log('taking thread: ' + freeThread.id);
			
			jobFunction.apply({}, [null, freeThread]);
		},
		
		killDocument: function(document) {
			var pool = this;
			var thread = document.thread;
			delete(pool._documents[document.id]);
			pool.killThread(thread);
			
			document = null;
		},
		
		killThread: function(thread) {
			var pool = this;
			
			if(!thread) { return; }

			this.message('event', 'killing thread', thread.id);
			
			pool._threads = _.without(pool._threads, thread) ;
			pool._freeThreads = _.without(pool._freeThreads, thread) ;
			delete(pool._threadsById[thread.id]);
			
			thread.destroy();
			
			thread = null;
			
			pool.createThread(function() {
				pool.runNextJob();
			});
			
		},
		
		/*
		 * tell the pool that a thread has finished it's work
		 * the pool will add the thread onto the end of its freeThreads and run the next job
		 */
		releaseThread: function(thread) {
			var pool = this;
			
			this.message('event', 'freeing thread', thread.id);
			//console.log('freeing thread: ' + thread.id);
			
			pool._freeThreads.push(thread);
			
			pool.runNextJob();
		},
		
		/*
		 * a script has gone wrong - try to see why
		 */
		diagnose: function(patient, exception, callback) {
			var pool = this;
			
			patient.bootCodePath = pool._sandboxcodePath;
			
			pool._doctor.diagnose(patient, exception, callback);
			
		},
		
		/*
		 * a script has asked for some data - see what they want
		 */
		rpcRequest: function(document, requestName, options, finishedCallback) {
			
			finishedCallback(null, 'hello world');
			return;
			options.document = document;
			
			
			poolRequestFactory(requestName, options, function(error, response) {
				
				finishedCallback(error, response);
				
			});
			
			/*
			async.nextTick(function(error, response) {
			
				// check we havn't been bumped whilst we've been away
				if(!document || document.status=='died') {
					return;
				}
				
				finishedCallback(null, 'this is the output of a request sdfdff');
				
			});
			*/
			
		}
	});
	
});