
/*!
 * Container
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
		handy = require('./tools/handy'),
    async = require('async'),
    EventEmitter = require('eventemitter2').EventEmitter2,
    registryFactory = require('./registry'),
    queryFactory = require('./query'),
    pigeonhole = require('./tools/pigeonhole');

/**
 * closes off a particular pigeon hole into an accessor function
 * (used by attr() and data())
 */

var pigeonHoleClosure = function(container, hole){

	// called as attr('name', val) : attr({..}) : attr('name') : attr()
	var ret = function(){
		var self = this;
		var args = _.toArray(arguments);

		// this means we want the raw data
		if(args.length<=0){
			return hole.raw();
		}
		else if(args.length==1){
			var arg = args[0];

			// we are settings lot of properties at the same time
			if(_.isObject(arg)){
				hole(arg);
				return container;
			}
			// we are getting a single property
			else{
				return hole(arg);
			}

		}
		// this is a set operation
		else{
			hole(args[0], args[1]);
			return container;
		}
	}

	ret.changed = function(){
		return hole.changed();
	}

	return ret;

}

var propertyClosure = function(container, hole, field){

	return function(val){
		if(!_.isUndefined(val)){
			hole(field, val);
			return container;
		}
		else{
			return hole(field);
		}
	}

}

var Container = {

	init: function(rawMeta, rawAttr){

		var self = this;

		if(_.isEmpty(rawAttr)){
			if(!_.isString(rawMeta)){
				rawAttr = rawMeta;
				rawMeta = rawAttr ? rawAttr._meta : null;
			}
			else{
				rawMeta = {
					tag:rawMeta
				}
			}
		}
		else {
			if(_.isString(rawMeta)){
				rawMeta = {
					tag:rawMeta
				}
			}
		}

		_.extend(this, EventEmitter.prototype);
	
		this._quarryContainer = true;

		// the actual attributes object wrapped in a pigeonhole
		var attr = pigeonhole(rawAttr);

		// the transient data wrapped in a pigeonhole
		var data = pigeonhole(rawAttr ? rawAttr._data : null);

		// the meta data holding class, id, tag etc
		var meta = pigeonhole(_.extend({
			// the #id value
			id:null,

			// the type
			tag:null,
			// the .class values
			classNames:{

			}
		}, rawMeta));

		// the registry for holding id, tag and classnames for direct children
		var registry = registryFactory();	

		this.registry = function(){
			return registry;
		}

		this._middleware = [];

		/*
		 * Properties
		 *
		 *
		 */

		// the attr() accessor
		this.attr = pigeonHoleClosure(this, attr);

		attr.on('change', function(field, value){
			self.emit('attr', field, value);
		})

		// the data() accessor
		this.data = pigeonHoleClosure(this, data);

		data.on('change', function(field, value){
			self.emit('data', field, value);
		})

		// the meta() accessor
		this.meta = pigeonHoleClosure(this, meta);

		meta.on('change', function(field, value){
			self.emit('meta', field, value);
		})

		// the id() accessor
		this.id = propertyClosure(this, meta, 'id');

		// the quarryid() accessor
		this.quarryid = propertyClosure(this, attr, '_id');

		// the supplier() accessor
		this.supplier = propertyClosure(this, data, 'supplier');

		// the tag() accessor
		this.tag = propertyClosure(this, meta, 'tag');



		this.changed = function(){

			var meta = this.meta.changed();
			var attr = this.attr.changed();

			if(!attr && !meta){
				return null;
			}

			var ret = attr ? attr : {};

			if(meta){
				ret._meta = meta;
			}
			
			return ret;
		}

		var isNew = false;

		// auto-generate an id
		if(!this.quarryid()){
			this.quarryid(handy.quarryid());
		}

		this.isNew = function(val){

			if(arguments.length>0){
				isNew = arguments[0];
			}
			return isNew;
		}
	},

	name: function(){
		return this.toString();
	},

	// nice printable version
	toString: function(){
		var self = this;
		var parts = [];
		_.each([
			self.attr('name'),
			self.attr('title'),
			self.tag(),
			self.id() ? '#' + self.id() : '',
			_.map(_.keys(self.classNames()), function(className){return '.' + className;}).join(', ')
		], function(val){
			if(!_.isEmpty(val)){
				parts.push(val);
			}
		});

		return parts.join(' : ');
	},

	isA: function(tag){
		return this.tag()==tag;
	},

	// get classNames object
	classNames: function(){
		return this.meta('classNames');
	},

	// returns boolean
	hasClass: function(className){
		var classNames = this.meta('classNames');
		return classNames[className] ? true : false;
	},

	// returns self
	addClass: function(className){
		var classNames = this.meta('classNames');
		classNames[className] = true;
		return this;
	},

	// removes the class from the object
	removeClass: function(className){
		var classNames = this.meta('classNames');
		delete(classNames[className]);
		return this;
	},

	/*
	 * Tree - this is ALL in memory
	 *
	 *
	 */

	// get a list of this containers direct children
	children: function(){
		return this.registry().children();
	},

	// get a list of this containers descendents
	descendents: function(){
		return this.registry().descendents();
	},

	// get a list of this containers parents
	parent: function(){
		return null;
	},

	// get a list of this containers parents
	ancestors: function(){
		var arr = [];
		var parent = this.parent();
		while(parent!=null){
			arr.push(parent);
			parent = parent.parent();
		}
		return arr;
	},

	// add each root element into the given container
	pourInto: function(parent){
		_.each(this.children(), function(child){
			parent.append(child);
		});
		return this;
	},

	

	/*
	 * Children Access
	 *
	 *
	 */

	count: function(index){
		var children = this.children();
		return children.length;
	},

	at: function(index){
		var children = this.children();
		return children[index];
	},

	first: function(){
		var children = this.children();
		return children[0];
	},

	last: function(){
		var children = this.children();
		return children[children.length-1];
	},

	/*
	 * Middleware
	 *
	 *
	 */

	middleware: function(eventName){
		return eventName ? (
			this._middleware[eventName] ? 
				this._middleware[eventName] : this._middleware[eventName] = []
		) : this._middleware;
	},

	use: function(eventName, middlewareFunction){
		if(!_.isFunction(middlewareFunction)){
			return;
		}

		var arr = this.middleware(eventName);
		arr.push(middlewareFunction);

		return this;
	},

	replace: function(eventName, middlewareFunction){
		if(!_.isFunction(middlewareFunction)){
			return;
		}
		this._middleware[eventName] = [middlewareFunction];
	},

	chainMiddleware: function(eventName, options, completeCallback){
		var self = this;
		var middlewareArray = this.middleware(eventName);

		if(!completeCallback){
			completeCallback = options;
			options = {
				args:[]
			};
		}

		var args = options.args || [];

		async.forEachSeries(middlewareArray, function(middlewareFunction, nextMiddleware){

			var middlewareFunctionCallback = options.each || function(results, next){
				next();
			}

			var middlewareFinishedCallback = function(error, results){
				if(!error){
					middlewareFunctionCallback(results, nextMiddleware)	
				}
				else{
					nextMiddleware(error);
				}
			}

			middlewareFunction.apply(self, args.concat([middlewareFinishedCallback]));

		}, completeCallback);
	},
	
	// loop each child and apply the given function to it
	each: function(selector, context, eachFunction, finishedCallback){

		// we are running in already loaded mode
		if(_.isFunction(selector)){
			eachFunction = selector;
			finishedCallback = context;
			selector = null;
			context = null;

			async.forEach(this.children(), function(child, next){
				// this means the each function is wanting the callback
				if(eachFunction.length>=2){
					eachFunction.apply(child, [null, child, next]);
				}
				else{
					eachFunction.apply(child, [null, child]);
					next();
				}
				
			}, finishedCallback);
		}
		// we are running in load mode
		else{

			// this means there is no context
			if(_.isFunction(context)){
				eachFunction = context;
				finishedCallback = eachFunction;
				context = null;
			}

			this.find(selector, context, function(error, resultsContainer){
				resultsContainer.each(eachFunction, finishedCallback);
			})
		}
		
		return this;
	},

	/*
	 * Finding
	 *
	 *
	 */

	find: function(selector, context, callback){

		if(!_.isFunction(callback)){
			callback = context;
			context = null;
		}

		var self = this;
		
		var finalResultsContainer = factory();

		var query = null;

		// is the selector already a query?
		if(_.isObject(selector) && selector._isQuery){
			query = selector;
		}
		else{
			query = queryFactory(selector, context);
		}

		this.chainMiddleware('find', {
			args:[query],
			// the function run by each find middleware as the callback
			// lets merge all the middleware results into one container
			each:function(resultsContainer, next){
				resultsContainer.pourInto(finalResultsContainer);
				next();
			}
		}, function(error){			
			callback(error, finalResultsContainer);
		});

		return this;
	},
	
	recurse: function(recurseFunction){
		recurseFunction.apply(this, [this]);
		_.each(this.descendents(), recurseFunction);
		return this;
	},

	// used when a new container is built from
	build: function(newContainer, callback){
		this.chainMiddleware('build', {
			args:[newContainer]
		}, callback);
		return this;
	},

	

	/*
	 * Saving
	 *
	 *
	 */

	save: function(callback){
		this.chainMiddleware('save', callback);
		return this;
	},

	remove: function(callback){
		this.chainMiddleware('remove', callback);
		return this;
	},

	close: function(callback){
		this.chainMiddleware('close', callback);
		return this;
	},

	append: function(child, callback){
		var self = this;
		var append = this.middleware('append');

		var appendedMiddleware = function(error, appendedResult){
			if(callback){
				callback(null, child);	
			}
		}
		if(_.isArray(child)){
			async.forEachSeries(child, function(childItem, next){
				self.append(childItem, next);
			}, appendedMiddleware);
		}
		else{
			this.chainMiddleware('append', {
				args:[child]
			}, appendedMiddleware);
		
		}
		return this;	
	},

	// add this container to a parent
	appendTo: function(parent, callback){
		parent.append(this, callback);
		return this;
	},

	// get a list of this containers direct children
	clone: function(){
		return factory(this.raw());
	},

	raw: function(filterFunction){

		filterFunction = filterFunction ? filterFunction : function(data){
			return data;
		}

		var ret = this.attr();

	  ret._meta = this.meta();
	  ret._data = this.data();

	  ret._children = [];

	  _.each(this.children(), function(child){
	    var childData = child.raw();

	    ret._children.push(filterFunction(childData));
	  })

	  return filterFunction(ret);
	},

	parseContract: function(contractString){
		return this.registry().parseContract(contractString);
	},

	isSupplierType: function(supplierType){
		var supplier = this.supplier();

		return supplier && supplier.type == supplierType;
	}


};

/**
 * the base container closure - this provides everything at base level
 */

// methods
var factory = function(rawMeta, rawAttr){

	if(rawMeta && rawMeta._quarryContainer){
		return rawMeta;
	}

	var container = Object.create(Container);

	container.init(rawMeta, rawAttr);

	container.factory = function(rawData, rawAttr){
		return factory(rawData, rawAttr);
	}

	var addChild = function(child, next){
		child.parent = function(){
			return container;
		}
		container.registry().addContainer(child);
		if(next){
			next();	
		}
	}

	// add the container to the registry when appended
	container.use('append', addChild);

	// the default 'look within my registry' middleware
	container.use('find', function(query, next){
		var resultsContainer = factory();

		this.registry().find(query, function(error, results){
			_.each(results, function(result){
				resultsContainer.append(result);
			});
			
			next(error, resultsContainer);
		});
	})

	_.each(container.attr('_children'), function(childData){
			var child = factory(childData);

			addChild(child);
	})
	
	return container;
}

exports = module.exports = factory;
