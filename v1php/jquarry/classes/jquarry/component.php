<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Component - this is a very top level concept that is basically a 'thing' in the context of jquarry
 *
 * this is the base class for things like widgets / websites and applications
 *
 * i.e. things that might want to render views and run scripts
 *
 * components can require other types of components
 *
 * they can also point to a folder that will be used to source files from
 *
 * the component class is very abstract - a website will behave different to a widget and different again to a plugin
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/component.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Component {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory Shortcuts
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// keep track of the singletons by their id
	protected static $singletons = array();
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Main factory - makes components from strings
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// this is the main factory method - $query can be a pointer or a string that will
	// become a pointer - the context is the component we have created this from
	//
	// 
	public static function factory($pointer, $context = null)
	{
		if(empty($pointer)) { return null; }
		
		
		if(is_string($pointer))
		{	
			$pointer = Jquarry_Pointer::factory($pointer, $context);
		}
		
		// first lets check the cache to see if we have one of these already
		$cachedobject = Jquarry_Componentcache::getobject($pointer);
		
		if($cachedobject)
		{
			$cachedobject->cacheinit();
			return $cachedobject;
		}
		else
		{
			$classname = $pointer->classname();
			
			$newobject = new $classname($pointer, $context);
		
			// set the new one to the cache
			Jquarry_Componentcache::setobject($pointer, $newobject);
			
			return $newobject;
		}
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Parent factory - gets the parent for a child component
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// factory method for getting a parent component
	public static function parentfactory($child)
	{
		if($child->is_default()) { return; }
		
		$extends = $child->get_extends();

		if(!$extends) { return; }
		
		$pointer = Jquarry_Pointer::factory($extends, $child);
		
		if(!$pointer) { return; }
		
		return self::singleton($pointer);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Singleton factory - uses factory but on a singleton basis (singletons are based on the component->name())
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// factory method for singletons
	public static function singleton($pointer)
	{
		if(empty($pointer)) { return null; }
		
		if(is_string($pointer))
		{	
			$pointer = Jquarry_Pointer::factory($pointer);
		}
		
		return isset(self::$singletons[$pointer->name()]) ? 
			self::$singletons[$pointer->name()] : 
			self::$singletons[$pointer->name()] = self::factory($pointer);
		
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type factory - useful for forcing the type of component - this is basically a shortcut
	 *
	 * if you say typefactory('folder', 'blueprint')
	 *
	 * it translates into 'blueprint[folder]'
	 *
	 ********************************************************************************************************************************
	*/
	
	// factory method for singletons
	public static function typefactory($pointer, $type, $singleton = false)
	{
		if(empty($pointer)) { return null; }
		
		if(is_string($pointer))
		{
			if(!preg_match('/^\w+\[.*?\]/', $pointer))
			{
				$pointer = $type.'['.$pointer.']';
			}
			
			$pointer = Jquarry_Pointer::factory($pointer);
		}
		
		return $singleton ? self::singleton($pointer) : self::factory($pointer);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Blueprint factory - shortcut to typefactory with 'blueprint' as the type
	 *
	 ********************************************************************************************************************************
	*/
	
	// factory method for singletons
	public static function blueprintfactory($pointer)
	{
		if(empty($pointer)) { return null; }
		
		return self::typefactory($pointer, 'blueprint', true);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Pointer processing - this is called within the pointer constructor and gives each
	 * component class the chance to modify the pointer before it is passed onto the constructor
	 * of the component (which is why this is static)
	 *
	 ********************************************************************************************************************************
	*/
	
	// this will be overriden by each type of component in order to boostrap the pointer
	public static function process_pointer($pointer)
	{
		if(empty($pointer)) { return null; }
		
		$classname = $pointer->classname();
		
		$classname::do_process_pointer($pointer);
	}
	
	protected static function do_process_pointer($pointer)
	{
		
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// a primitive config objects for this component
	public $config;
	
	// the pointer that is generated from the path passed to the factory
	// this contains:
	//
	// drive (core | author)
	// type (website | widget)
	// name (simpletree)
	// file (what file / profile we are looking at)
	protected $pointer;
	
	// the (singleton) component this one extends from
	protected $parent;
	
	// the component this one is contained by (this is mostly the case for file based components but
	// you can have a directory based component that lives inside another components directory (like a widget in a website)
	protected $container;
	
	protected function __construct($pointer)
	{
		$this->pointer = $pointer;
		
		$this->init();
		
		// lets make a blank config if we don't have one
		if($this->config==null)
		{
			$this->config = Jquarry_Primitive::factory('config');
		}
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * INIT
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_jquarry()
	{
		return $this->name()=='framework[core:/framework/jquarry]';
	}
	
	// this should be overriden to setup the component
	protected function init($path)
	{
		$this->resolve_inheritance();
	}
	
	// this is run when the component was in the cache and needs setting up again
	protected function cacheinit()
	{
		$this->resolve_pointer_inheritance();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Cache
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// should we cache this component
	// needs work later for authors
	public function should_cache()
	{
		return $this->pointer->drive()=='core';	
	}
	
	protected function resolve_pointer_inheritance()
	{
		if($this->parent)
		{
			$this->pointer->inherits(array_merge($this->parent->pointer->inherits(), array($this->parent->pointer())));
		}
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Inheritance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// work out what other component of this type we might extend
	// we will use the default one as a basis (if it exists!)
	protected function resolve_inheritance()
	{
		// but we are allowed to extend from what we want
		$this->config = $this->bootstrap_config();
		
		// if we are the default for this type then we don't have a parent
		// so we just bootstrap the config
		if($this->is_default())
		{
			$root_config = $this->get_root_config();
			
			$this->config = $root_config->merge($this->config);
		}
		else
		{
			// right - now lets get a reference to the parent
			$this->load_parent();

			$this->resolve_pointer_inheritance();
			
			// then we create a merged version of the config
			$this->config = $this->parent->config->merge($this->config);
		}
	}
	
	// works out what this component inherits from
	public function get_extends()
	{
		if($this->is_default()) { return null; }
		
		// the default is the auto extends
		$extends = 'default';
		
		if($this->config && $this->config->has('extends'))
		{
			$extends = $this->config->get('extends');
		}
		
		return $extends;
	}
	
	// loads the parent for this component
	public function load_parent()
	{
		if($this->is_default()) { return null; }
		
		if($this->_parent_loaded) { return $this->parent; }
		
		$this->_parent_loaded = true;
		
		return $this->parent = Jquarry_Component::parentfactory($this);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Config
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// returns a config object for the root file
	// all components use this as a base config but there is not such a thing as a root component - it's just the config
	protected function get_root_config()
	{
		return Jquarry_Primitive::factory('config', Jquarry_Filestore::instance()->path(Kohana::$config->load('jquarry.component.root_config')));
	}
	
	// bootstrap the config file or create a blank one so we can see what component this inherits from
	// we will end up merging the config from the parent but we need to load and look just for a minute
	protected function bootstrap_config()
	{
		$config = $this->load_config();
		
		if(!$config)
		{
			$config = Jquarry_Primitive::factory('config');
		}
		
		return $config;
	}
	
	// cascading config
	public function config($key)
	{
		$ret = $this->config->get($key);
		
		if($ret==null && $this->parent)
		{
			return $this->parent->config($key);
		}
		
		return $ret;
	}
	
	// abstract function designed to load the config for this component
	abstract protected function load_config();
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Profiles
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// we want to include the files from a component's profile
	// this might be another component (because we hit another one in the script source)
	//
	// we will run both the server and the client profiles and add the result to the profile files
	public function add_to_profile()
	{
		Jquarry_Profile::instance()->add($this->pointer());
	}
	
	public function get_profile_imports()
	{
		return $this->config->get('import');
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Container
	 *
	 * the container is where the files for a component live inside the directory of another component
	 *
	 * for example a blueprint.json might live in the folder of another widget
	 *
	 * it is a blueprint is it's id is: blueprint[core:/widget/tree/model.json]
	 *
	 * in this example - the tree widget will have created the blueprint because techincally it owns it
	 * the container therefore would be the widget in this example
	 *
	 * it's useful because if the blueprint wants to refer to files in the container it can use container: as the drive
	 *
	 ********************************************************************************************************************************
	*/
	
	public function container($new = null)
	{
		return !empty($new) ? $this->container = $new : $this->container;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Context
	 *
	 * gives a component the chance to change what should be used as the context
	 *
	 * for instance - a web-page will return it's website as the context so subsequent file loads are done from the website not the page
	 *
	 ********************************************************************************************************************************
	*/
	
	public function get_context()
	{
		// the default is to just return this as the context - this is designed to be overriden
		return $this;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Sub component spawning
	 *
	 * this creates components out of the conent of this component
	 *
	 * this is useful for websites making webpage components from .htm files
	 * or widgets making blueprint components from .json files
	 *
	 * this should be overriden by each component type to decide what type of
	 * component to return - the default is file and directory based
	 *
	 ********************************************************************************************************************************
	*/
	public function spawn_component($url)
	{
		$url = $this->process_url($url);
		
		$pointer = $this->ensure_file_pointer($url);

		$type = $this->component_type_from_file_pointer($pointer);

		$castedpointer = $this->get_file_pointer($pointer->id()." as {$type}", true);
		
		$child_component = Jquarry_Component::factory($castedpointer, $this);
		
		$child_component->container($this);
		
		return $child_component;
	}
	
	// overide this to have control over what type of component is returned
	// automatically from file requests
	//
	// you can always override this by using the 'as' syntax of pointer queries
	protected function component_type_from_file_pointer($pointer)
	{
		if(!$pointer->exists())
		{
			return 'component';		
		}
		
		return $pointer->is_file() ? 'file' : 'directory';
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Render
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// render a page
	public function render()
	{
		$this->add_to_profile();
		
		if($this->exists())
		{
			$view = Jquarry_View::factory($this->contents(), $this);
		
			return $view->render();
		}
		
		return '';
	}
	
	public function contents()
	{
		return $this->pointer->get_contents();
	}
	
	// override this to add default urls to serving components
	public function process_url($url)
	{
		return $url;
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Pointers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// load the filesystem node from the pointer
	public function load()
	{
		return $this->pointer->load();
	}
	
	public function ensure_file_pointer($query)
	{
		$pointer = Jquarry_Pointer::factory($query, $this, true);
		
		if(!$pointer->exists() && $this->parent)
		{
			$pointer = $this->parent->ensure_file_pointer($query);
		}
		
		return $pointer;
	}
	
	public function get_file_pointer($query, $filemode = false)
	{
		return Jquarry_Pointer::factory($query, $this, $filemode);	
	}
	
	// processes a pointer query and returns and array of the component owner and the pointer
	// 
	// file mode means that we are actually checking for a file rather than perhaps
	// another component - this means single string like images are interpreted as a filepath
	// rather than the location of a widget
	//
	// the only time this is needed is when you are after a folder within a component
	// from the top level (so the path doesn't contain a slash)
	//
	// e.g. images
	//
	// this could mean 'the folder called images' or 'the widget whos location is images'
	//
	// in filemode - the folder is inferred
	// otherwise we are looking for a component location
	protected function get_full_pointer($query = null, $filemode = false)
	{
		if(empty($query))
		{
			return array(
			
				"component" => $this,
				
				"pointer" => $this->pointer
				
			);
		}
		
		// now make a pointer using the owner as the context
		$pointer = Jquarry_Pointer::factory($query, $this, $filemode);
		
		// if we are pointing inside ourselves then return $this
		if($pointer->is_for_component($this))
		{
			return array(
			
				"component" => $this,
				
				"pointer" => $pointer
				
			);
		}
		// if not then make a singleton to pass the request off to using the file part of the pointer
		else
		{
			return array(
			
				"component" => Jquarry_Component::singleton($pointer),
				
				"pointer" => $pointer
				
			);
		}
	}
	
	// load a file from this component and then cascade up the inheritance tree
	public function get_file($query = null, $cascade = true)
	{
		if(empty($query)) { return false; }
		
		$query = $this->get_full_pointer($query, true);
		
		$owner = $query["component"];
		$pointer = $query["pointer"];
		
		$ownercontext = $owner->get_context();
		
		return $ownercontext->cascade_file($pointer->file(), $cascade);
	}

	// this is the abstract function that each override will deal with
	// directories will cascade the file up the inheritance tree
	// and files will pass the request off to their container
	abstract protected function cascade_file($file = null, $cascade = true);
	
	// tells you if a file actually exists
	public function has_file($file = null, $cascade = true)
	{
		if(empty($file)) { return false; }
		
		$fileobj = $this->get_file($file, $cascade, true);
		
		return $fileobj->exists();
	}

	
	/**
	 ********************************************************************************************************************************
	 *
	 * names, paths and URLS
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// gives you a url for this component
	//abstract public function url($path = null);
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Pointer
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// is this the default component for a given type
	public function is_default()
	{
		return $this->pointer->is_default();
	}
	
	public function id()
	{
		return $this->pointer->id();
	}
	
	public function name()
	{
		return $this->pointer->name();
	}
	
	public function location()
	{
		return $this->pointer->fulllocation();
	}
	
	public function ext()
	{
		return $this->pointer->ext();
	}
	
	public function pointer()
	{
		return $this->pointer;
	}
	
	public function type()
	{
		return $this->pointer->type();
	}
	
	public function exists()
	{
		return $this->pointer->exists();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type helpers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_file()
	{
		return false;
	}
	
	public function is_directory()
	{
		return false;
	}
	
	public function is_page_serving()
	{
		return false;
	}
	
	// overriden
	public function is_page()
	{
		return false;
	}
	
	// overriden
	public function is_view()
	{
		return false;
	}
	
	public function is_image()
	{
		return false;
	}
	
	public function is_blueprint()
	{
		return false;
	}
	
	public function is_form()
	{
		return false;
	}
	
}
