/*
 * @class quarryscript.document
 * @filename   	quarryscript/document.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * one document being parsed and processed
 *
 */

define([

	'base',
	
	'underscore',
	
	'async',
	
	'./htmlparser',
	
	'./template',
	
	'./script'
	
], function(

	base,
	
	_,
	
	async
	
	htmlparserClass,
	
	runnerClass,
	
	templateFactory,
	
	scriptFactory
	
) {
	
	// because the document looks after running the scripts in the sandbox,
	// it is responsible for connecting the rpc requests and co-ordinating their return
	return base.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		factory: function(options, readyCallback) {
			var doc = new this.prototype.constructor(options);
			
			doc.parse(readyCallback);
			
			return doc;
		}
		
		
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
			
		init:function(options) {
			var id = options.id;
			var source = options.source;
			var sandbox = options.sandbox;
			
			this._id = id;
			this._source = source;
			this._output = source;
			this._nextId = 0;
			this._templates = [];
			this._templatesById = {};
			this._scripts = [];
			this._scriptsById = {};
			
		},
		
		parse: function(parsedCallback) {
			var parser = htmlparserClass.instance();
			
			parser.parse(this, parsedCallback);
		},
		
		id: function() {
			return this._id;
		},
		source: function() {
			return this._source;
		},
		
		output: function() {
			return this._output;
		},
		
		replaceOutput: function(what, replaceWith) {
			return this._output = this._output.replace(what, replaceWith);
		},
		
		nextId: function() {
			return this._nextId++;
		},
		
		render: function() {
			var document = this;
			
			_.forEach(this.templates(), function(template) {
				document.renderTemplate(template);
			});
			
			_.forEach(this.scripts(), function(script) {
				document.renderScript(script);
			});
			
			return document.output();
		},
		
		scripts: function() {
			return this._scripts;
		},
		
		templates:function() {
			return this._templates;
		},
		
		renderTemplate: function(template) {
			
			var document = this;
			
			var templateInjection = [
				'<script type="text/template" id="' + template.id + '">',
				template.text,
				'</script>'
			].join("\n");
			
			this.replaceOutput(template.replaceCode, templateInjection);
			
		},
		
		renderScript: function(script) {
			
			var document = this;
			
			var scriptInjection = script.output;
			
			this.replaceOutput(script.replaceCode, scriptInjection);
			
		},
		
		addTemplate: function(rawTemplate) {
			
			var template = templateFactory(rawTemplate);
			
			this._templates.push(template);
			this._templatesById[template.id] = template;
			
			this.replaceOutput(template.originalMatch, template.replaceCode);
			
			return template;
		},
		
		addScript: function(rawScript) {
			
			if(!script.args.type || !script.args.type.match(/quarry/)) { return; }
			
			var script = scriptFactory(rawScript);
			
			this._scripts.push(script);
			this._scriptsById[script.id] = script;
			
			this.replaceOutput(script.originalMatch, script.replaceCode);
			
			return script;
		}
		
	});
	
});