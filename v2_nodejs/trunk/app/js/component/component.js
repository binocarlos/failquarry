/**
 * @class jquarry.component
 * @extends base
 * @filename   	jquarry/component.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * component base class
 *
 * a component is a directory that contains some files
 * it uses a file-based element to access the file-system which means you can use quarry selectors
 * for the files inside of a component
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
	
	// here is where we have special components that live elsewhere
	var typeShortcuts = {
		
		'website':'server/website'
		
	};
	
	return base.extend({
		
		/*
		 * the config can contain:
		 *
		 * **path** this is a string that represents that the component is
		 * type<location> is the format
		 * 
		 * 		$quarry.component({
		 *			path:'website'
		 *		})
		 *
		 *
		 * **config** a config grabbed from somewhere other than the components directory
		 * this is the last config in the sequence
		 *
		 * **element** an instance of this component saved into the users quarry
		 * this element will contain children with which to feed the component
		 * and possibly an altered config too
		 *
		 * the element is optional - it represents a component that has been saved with data
		 *
		 *
		 *
		 */
		factory: function(options, finishedCallback) {
			
			// then we assume the config to be the path
			if(_.isString(options)) {
				options = {
					type:options
				};
			}
			
			if(typeShortcuts[options.type]) {
				
				options.type = typeShortcuts[options.type];
				
			}
			
			require(['component/' + options.type], function(componentClass) {
				
				var component = new componentClass(options);
				
				// when the component is all ready - return it
				component.bind('ready', function() {
					
					finishedCallback(null, component);
					
				});
				
				// tell the component to do it's setup work
				component.setupComponent();
			});
			
		}
		
	}, {
		
		/*
		 * the component type
		 */
		_type: null,
		
		/*
		 * the ronfig for this component
		 */
		_config: null,
		
		/*
		 * the physical file location the path resolved to
		 * this is always resolved after init (allowing overriden classes to modify the path first)
		 */
		_location: null,
		
		
		init: function(options) {
			
			if(!options) { 
				throw new Error("Component Requires Options");
			}
			
			// the type of component
			this._type = options.type;
			
			// the robject config
			this._config = robject.factory(options.config);
			
			// the location for this component - processed via system.resolvePath
			this._location = system.resolvePath(options.location);
			
		},
		
		/*
		 * setup the component - called from the factory (to give things a chance to settle) trigger ready when done
		 */
		setupComponent: function() {
			this.trigger('ready');
		},
		
		/*
		 * shortcut to the robject
		 */
		config: function(key, def) {
		
			var ret = this._config.get(key);
			
			return ret!=null ? ret : def;
			
		},
		
		id: function() {
			
			return [this.type(), this.location()].join(':');
			
		},
		
		/*
		 * what type is this component
		 */
		type: function() {
			
			return this._type;
			
		},
		
		/*
		 * where is the component physically
		 */
		location: function(append) {
			
			return append!=null ? this._location + append : this._location;
			
		},
		
		/*
		 * get an object that can be used to re-create this component
		 */
		freeze: function() {
			return {
				type:this.type(),
				location:this.location(),
				config:this._config.rawData()
			};
		}
		
		
	});
	
});