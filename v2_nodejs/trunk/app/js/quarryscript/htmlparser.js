/*
 * @class quarryscript.processor
 * @filename   	quarryscript/htmlparser.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * the script parser - takes a HTML page and returns chunks of scripts and templates with replace codes
 *
 */

define([

	'base',
	
	'underscore',
	
	'async',
	
	'./document'
	
], function(

	base,
	
	_,
	
	async,
	
	documentClass
	
) {
	
	if(!context) { context = this; }
	
	var _instance = null;
	
	return {
		instance:function() {
			return _instance ? _instance : _instance = parserClass.factory();
		}
	};
	
	var parserClass = base.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		factory: function() {
			return new this.prototype.constructor();
		}
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		
		name:'Quarry HTML Parser',
		
		// keep the compiled regexps for the parser
		_regexps:{},
		
		init: function() {
			this.setupRegExps();
		},
		
		/*
		 * takes a document object and fills it based on the source
		 */
		parse: function(document, finishedCallback) {
			
			var parser = this;
			
			async.series([
				function(next) {
					parser.parseInlineTemplates(document, next);
				},
				function(next) {
					parser.parseInlineScripts(document, next);
				}
			], function(error) {
				finishedCallback(error, document);
				
			});
			
		},
		
		/*
		 * pre-compile the regexps used by the parser
		 */
		setupRegExps: function() {
			
			this._regexps.inline_template = /<template([^<>]*?)>([\s\S]*?)<\s*\/\s*template>/i;
			
			/*
				// the opening tag
				<template
				
				// the arguments
				([^<>]*?)
				
				// close tag
				>
				
				// the contents of the script tag (with JS . char -> [\s\S])
				([\s\S]*?)
				
				// closing tag
				<\s*\/\s*template>
			*/
			
			this._regexps.inline_script = /<script ([^<>]*?)>([\s\S]*?)<\s*\/\s*script>/i;
			
			/*
				// the opening tag
				<script
				
				// the arguments
				([^<>]*?)
				
				// close tag
				>
				
				// the contents of the script tag (with JS . char -> [\s\S])
				([\s\S]*?)
				
				// closing tag
				<\s*\/\s*script>
			*/				
			
			this._regexps.args = /(\w+)\s*=\s*["'](.*?)["']/gi;
			
			/*
			
				// the property
				(\w+)
				
				// equals with spaces
				\s*=\s*
				
				// the value enclosed by quotes
				["'](.*?)["']
				
			*/
												
		},
		
		/*
		 * parse a line of arguments (prop="value")
		 */
		parseArgs: function(string) {
	
			var args = {};
					
			while (match = this._regexps.args.exec(string)) {
				args[match[1]] = match[2];
    		}
    		
			return args;
			
		},
		
		/*
		 * parse the template tags
		 */
		parseInlineTemplates: function(document, finishedCallback) {
			
			var parser = this;
			
			var lastMatch = [];

			async.whilst(
			    function () {
			    	return lastMatch = document.output().match(parser._regexps.inline_template);
			    },
			    function (callback) {
			    	
			        document.addTemplate({
			        	originalMatch:lastMatch[0],
			        	text:lastMatch[2],
			        	args:parser.parseArgs(lastMatch[1])
			        });
			        
			        callback();
			        
			    },finishedCallback
			    
			);			
		},
		
		/*
		 * parse the script tags
		 */
		parseInlineScripts: function(document, finishedCallback) {
			
			var parser = this;
			
			var lastMatch = [];
			
			async.whilst(
			    function () {
			    	return lastMatch = document.output().match(parser._regexps.inline_script);
			    },
			    function (callback) {
			        
			        document.addScript({
			        	originalMatch:lastMatch[0],
			        	text:lastMatch[2],
			        	args:parser.parseArgs(lastMatch[1])
			        });
			        
			        callback();
			        
			    },
			    finishedCallback
			);			
		}
		
		
		
	});
	
});