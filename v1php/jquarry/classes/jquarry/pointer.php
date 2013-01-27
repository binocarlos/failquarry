<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Component Pointer - represents the understanding of 'what' we want in string form
 *
 * this can be a whole component (widget:simpletree) or a file within a component (widget:simpletree:/logo.gif)
 *
 * a pointer starts as a string and ends up as this object which describes what the string meant
 * the pointer is created with a context (i.e. the component that came across the string)
 * this means the pointer string can be relative to the context of the component (using parent and this also)
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/pointer.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Pointer {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// a map of component type onto the class they should use
	// most will use directorybased
	protected static $classmap = array(
	
		'directory' => 'directorybased',
		
		'file' => 'filebased',
		
		'blueprint' => 'blueprint',
		
		'form' => 'form',
		
		'config' => 'config',
		
		'website' => 'website',
		
		'application' => 'application',
		
		'page' => 'page',
		
		'view' => 'view',
		
		'image' => 'image'
	
	);
	
	// return a new pointer
	public static function factory($query, $context = null, $filemode = false)
	{
		$pointer = new Jquarry_Pointer($query, $context, $filemode);
		
		// now lets check to see if the pointer is for another component
		if(!empty($pointer->cast))
		{
			$containerpointer = clone $pointer;
			
			$pointer->location = Tools_Path::join_fileparts($pointer->location, $pointer->file);
			$pointer->file = '';
			$pointer->type = $containerpointer->cast;
			$pointer->cast = null;
			
			$pointer->container = $containerpointer;
			
		}
		
		return $pointer;
	}
	
	
	// keep track of the inherits we come accross
	protected static $inherits_map = array();
	
	public static function inherits_singleton($id, $value = null)
	{
		if($value!=null)
		{
			self::$inherits_map[$id] = $value;
		}
		
		return self::$inherits_map[$id];
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// the string that started off this pointer
	protected $query = '';
	
	// the type of the pointer
	//
	// website
	// website[]
	protected $type;
	
	//
	// widget[tomjones:tree]
	//
	// widget[core:tree]
	//
	// the root for the location below (can be core / authors / root / website etc)
	protected $drive;
	
	// the component file system location
	//
	// widget[simpletree] -> core:/widget/simpletree
	//
	// widget[tomjones:tree] -> tomjones:/widget/simpletree
	//
	// widget[/somefolder/somewhere] -> core:/somefolder/somewhere
	//
	// blueprint[tomjones:/widget/tree/something.json] = a blueprint made from a location in another widget
	//
	protected $location;
	
	// the file within the pointer
	//
	// widget[tomjones:tree]->icon.png
	//
	// 
	protected $file;
	
	// a pointer to the component that this component lives in
	// this happens in casting operations where one component is plucked from within another
	protected $container;
	
	protected $cachekey;
	protected $cachecontents;
	protected $cachetime;
	protected $cacheflags;
	protected $cachefile;
	protected $cacheprofile;
	
	// this means the pointer is actually for another component based on the filepath and of this type
	// this is used by the factory to detect that a different object should be returned
	protected $cast;
	
	// keep track of how the profile wants this pointer file deliveres
	protected $delivery;
	
	// a pointer to the filesystem node that is the localpath for this pointer
	protected $filesystemnode;
	
	
	
	// widget[core:widget:imagegallery]->layout.png
	//
	// the type is the function - the argument is the filepath and the chained thing is the file
	// this means you can point to any folder/file and load it as a type and then dig into that to get files
	//
	// the syntax of a component pointer is:
	//
	// type[path]->file
	// widget[tree.simple]->layout.js - means the widget made from core/widget/tree/simple and get the layout.js inside it
	//
	// widget[tomjones:tree.simple]->layout.js - means the widget made from tomjones/widget/tree/simple and get the layout.js inside it
	//
	// this is basically a file path but means you choose where to convert to a component 
	//
	// widget[simpletree]->images/logo.png
	//
	// translates to:
	//
	// core/widget/simpletree/images/logo.png - but its at the simpletree folder level that the component is created
	//								
	// casting is for when there is a component that lives inside of another
	//
	// so if there is a blueprint inside of a widget:
	//
	// you can say widget[simpletree]->blueprint.json, context, 'blueprint'
	//
	// which means give me the blueprint that is contained by the simpletree as lives inside blueprint.json
	//
	// this translates as :
	//
	// widget[simpletree]->blueprint.json as blueprint
	
	protected function __construct($query, $context = null, $filemode = false)
	{
		$this->query = $query;
		
		// first check to see if we are begin casted into another type
		if(preg_match('/^(.*?) as (\w+)$/i', $query, $match))
		{
			$this->cast = $match[2];
			
			$query = str_replace(' as '.$this->cast, '', $query);
		}
		
		$componentpointer = $query;
		$filepointer = null;
		
		// see if we are after a file within a component
		if(preg_match('/^(.*?)->(.*?)$/', $query, $match))
		{
			$componentpointer = $match[1];	
			$filepointer = $match[2];
		}
		
		// check if we are just after just a file (test.js or folder/test.js)
		// if we have a context we assume it to be relative to the context
		// otherwise it is assume to be a plain file path
		
		// choose which regexp to use based on the filemode
		// this means will we interpret a single string as a filepath or assume it's a component location
		// basically the only difference is the file extension being optional
		
		$file_regexp = $filemode ? '/^([\w\.]+\/)*[\w\.]+(\.\w+)?$/' : '/^([\w\.]+\/)*[\w\.]+\.\w+$/';
		
		if(empty($filepointer) && preg_match($file_regexp, $componentpointer, $match))
		{
			// we assume this if there is no component part
			$filepointer = $componentpointer;
			$componentpointer = 'this';
		}
		
		
		// the regexp that matches the string widget[simpletree] or widget[tomjones:simpletree]
		$widget_type_regexp = '/^(\w+)\[(.*?)\]$/';
			
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		//
		// this means we dont have a type (e.g. widget[simpletree] just simpletree)
		//
		// if we have a context - we will used its type i.e. simpletree becomes widget[simpletree]
		//
		// if we don't - we treat the string as the type i.e. website becomes website[]
		//
		
		if(!preg_match($widget_type_regexp, $componentpointer, $match))
		{
			// if we don't have a context - treat the string as a type
			//
			// this is called mainly as entry points to create websites
			// most other things are called from a context
			if(!$context)
			{
				// website -> website[]
				//
				// widget -> widget[]
				$componentpointer .= '[]';
			}
			else
			{
				//Tools_Dev::do_print_r($context);
				// right so we are asking in context - lets check special pointers
				if($componentpointer=='this')
				{
					$context->pointer()->copyinto($this);
				}
				else if($componentpointer=='parent' && $parent = $context->load_parent())
				{
					$parent->pointer()->copyinto($this);
				}
				else
				{
					// simpletree -> widget[simpletree]
					$componentpointer = $context->type().'['.$componentpointer.']';
					
				}
			}
		}
		
		
			
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		// this means we are asking for a specific type e.g. widget[simpletree]
		//
		
		if(preg_match($widget_type_regexp, $componentpointer, $match))
		{
			// we have a clear type match
			$this->type = $match[1];
			
			$this->location = $match[2];
			
			// now lets see if the location contains a drive (used for authors) core:widget tomjones:simpletree
			if(preg_match('/^(\w+):(.*?)$/', $this->location, $match))
			{
				$this->drive = $match[1];
				$this->location = $match[2];
			}
			
			// now we check for special drives (like this or container)
			if($context)
			{
				if($this->drive=='this')
				{
					$contextpointer = $context->pointer();
					
					$this->drive = $contextpointer->drive();		
					$this->location = $contextpointer->location().'/'.$this->location;
				}
				else if($this->drive=='parent' && $parent = $context->parent())
				{
					$contextpointer = $parent->pointer();
					
					$this->drive = $contextpointer->drive();		
					$this->location = $contextpointer->location().'/'.$this->location;
				}
				else if($this->drive=='container' && $container = $context->container())
				{
					$contextpointer = $container->pointer();
					
					$this->drive = $contextpointer->drive();		
					$this->location = $contextpointer->location().'/'.$this->location;
				}
			}
			
			// is the location absolute (i.e. a full folder path) or do we want to inject the widget type into it
			//
			// e.g. widget[simpletree] wants simple = /widget/simpletree as the path
			//
			// whereas widget[/somefolder/somewhere] means /somefolder/somewhere as the path
			//
			// the drive will determine the root of the path (useful for websites where its the document root
			
			// we dont start with a slash so we assume we want to inject the component type into the path
			if(!empty($this->location) && !preg_match('/^\//', $this->location))
			{
				$this->location = '/'.$this->type.'/'.$this->location;
			}
		}
		
		if(!empty($filepointer))
		{
			$this->file = $filepointer;
		}
		
		Jquarry_Component::process_pointer($this);
		
		// now we have processed we can set some defaults
		if(empty($this->drive))
		{
			$this->drive = 'core';
		}
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Tells you the classname to use when making a component from this pointer
	 *
	 ********************************************************************************************************************************
	*/
	
	public function classname()
	{
		$classtype = $this->type();
		
		if(!isset(Jquarry_Pointer::$classmap[$classtype]))
		{
			if($this->is_file())
			{
				$classtype = 'file';
			}
			else
			{
				$classtype = 'directory';
			}
		}
		
		$classname = Jquarry_Pointer::$classmap[$classtype];
		
		return 'Jquarry_Component_'.ucfirst($classname);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Access to the component (a singleton version)
	 *
	 ********************************************************************************************************************************
	*/
	
	public function component()
	{
		return Jquarry_Component::singleton($this->name());
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Copy
	 *
	 * copy this pointer into another one (used when spawning files from directories)
	 *
	 ********************************************************************************************************************************
	*/
	
	public function copyinto($pointer)
	{
		$pointer->drive = $this->drive;	
		$pointer->type = $this->type;
		$pointer->location = $this->location;
		$pointer->file = $this->file;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * URLS and Paths
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// converts the drive into a filesystem path
	public function drivelocalpath()
	{
		// is the drive the current document root for a website
		if($this->drive=='documentroot')
		{
			return $_SERVER['DOCUMENT_ROOT'];
		}
		// is it an absolute path
		else if(preg_match('/^\//', $this->drive))
		{
			return $this->drive;	
		}
		else
		{
			$drive = $this->drive;
			
			if(empty($drive))
			{
				$drive = 'core';
			}
			
			if($drive!='core')
			{
				$drive = 'authors/'.$drive;
			}
			
			return Jquarry_Filestore::instance()->path($drive);
		}
	}
	
	// converts the drive into a URL
	// if mtime is set to true it will include the modified time within the url (only if its for a directory)
	public function driveurl($mtime = null)
	{
		if($this->iscached())
		{
			
		}
		
		// is the drive the current document root for a website
		if($this->drive=='documentroot')
		{
			return '';
		}
		// is it an absolute path
		else if(preg_match('/^\//', $this->drive))
		{
			return $this->drive;	
		}
		else
		{
			$drive = $this->drive;
			
			if($drive!='core')
			{
				$drive = 'authors/'.$drive;
			}
			
			return Jquarry_Filestore::instance()->url($drive, $mtime);
		}		
	}
	
	// get the full localpath for this pointer
	public function localpath($debug = false)
	{
		$path = $this->drivelocalpath();
		
		if(!empty($this->location))
		{
			$path = Tools_Path::join_fileparts($path, $this->location);
		}
		
		if(!empty($this->file))
		{
			$path = Tools_Path::join_fileparts($path, $this->file);
		}
		
		return $path;
	}
	
	// get the URL for this pointer
	public function url($mtime = true)
	{
		$usemtime = null;
		
		if($this->iscached())
		{
			$usemtime = $this->cachetime();
			$cachekey = $this->cachekey();
			$profilename = $this->cacheprofile();
			$filename = $this->cachefile();
			
			if(empty($profilename))
			{
				$profilename = 'default';
			}
			
			return Tools_Request::url("/cache/{$usemtime}/{$cachekey}/{$profilename}/{$filename}");
		}
		
		if($mtime && $this->exists() && $this->is_file())
		{
			$usemtime = $this->mtime();
		}
		
		$url = $this->driveurl($usemtime);
		
		if(!empty($this->location))
		{
			$url = Tools_Path::join_fileparts($url, $this->location);
		}

		if(!empty($this->file))
		{
			$url = Tools_Path::join_fileparts($url, $this->file);
		}
		
		return $url;
	}
	
	public function exists()
	{
		return file_exists($this->localpath());	
	}
	
	public function is_directory()
	{
		return !is_file($this->localpath());
	}
	
	public function is_file()
	{
		return is_file($this->localpath());
	}

	
	
	// tells you if this pointer is for the given component
	// ignores files - just based on name
	public function is_for_component($component)
	{
		if($component==null) { return false; }
		
		return $component->name()==$this->name();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * FileSystem
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function load_file()
	{
		return $this->load();
	}
	
	public function load_directory()
	{
		return $this->load();
	}
	
	public function load()
	{
		if($this->filesystemnode) { return $this->filesystemnode; }
		
		return $this->filesystemnode = Jquarry_Primitive::factory($this->is_file() ? 'file' : 'directory', $this->localpath());
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Props
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// just the component part (with the drive and everything)
	public function name()
	{
		$parts = array();
		
		if(!empty($this->drive))
		{
			$parts[] = $this->drive.':';
		}
		
		if(!empty($this->location))
		{
			$parts[] = $this->location;
		}
		
		return $this->type().'['.implode('', $parts).']';
	}
	
	// a unique id for the pointer including the file
	public function id()
	{
		$ret = $this->name();
		
		if(!empty($this->file))
		{
			$ret .= '->'.$this->file;
		}
		
		return $ret;
	}
	
	public function is_default()
	{
		return $this->location==$this->default_location();
	}
	
	// get the name of the default version for this pointer
	public function default_location()
	{
		// lets check if we have an extension
		
		return '/'.$this->type().'/default'.($this->ext() ? '.'.$this->ext() : '');	
	}
	
	public function drive($new = null)
	{
		return empty($new) ? $this->drive : $this->drive = $new;
	}
	
	public function type($new = null)
	{
		return empty($new) ? $this->type : $this->type = $new;
	}
	
	public function location($new = null)
	{
		return empty($new) ? $this->location : $this->location = $new;
	}
	
	public function delivery($new = null)
	{
		return empty($new) ? $this->delivery : $this->delivery = $new;
	}
	
	public function file($new = null)
	{
		return empty($new) ? $this->file : $this->file = $new;
	}
	
	public function cachefile($new = null)
	{
		return empty($new) ? $this->cachefile : $this->cachefile = $new;
	}
	
	// returns just the filename part of location + file
	public function filename()
	{
		$location = $this->fulllocation();
		
		$parts = explode('/', $location);
		
		return array_pop($parts);
	}
	
	// returns just the foldername part of location + file
	public function foldername()
	{
		$location = $this->fulllocation();
		
		$parts = explode('/', $location);
		
		$filename = array_pop($parts);
		
		return implde('/', $parts);
	}
	
	// returns location + file
	public function fulllocation()
	{
		$url = '';
		
		if(!empty($this->location))
		{
			$url = Tools_Path::join_fileparts($url, $this->location);
		}

		if(!empty($this->file))
		{
			$url = Tools_Path::join_fileparts($url, $this->file);
		}
		
		return $url;
	}
	
	public function ext()
	{
		if(preg_match('/\.(\w{2,4})$/', $this->localpath(), $match))
		{
			return strtolower($match[1]);
		}
		
		return null;
	}
	
	public function is_js()
	{
		return $this->ext()=='js';
	}
	
	public function is_css()
	{
		return $this->ext()=='css';
	}
	
	public function mimetype()
	{
		return File::mime_by_ext($this->ext());
	}
	
	public function mtime()
	{
		return filemtime($this->localpath());
	}
	
	public function get_contents()
	{
		if($this->iscached())
		{
			return $this->cachedcontents();
		}
		
		if(!$this->exists() || !$this->is_file()) { return null; }
		
		$file = $this->load();
		
		return $file->get_contents();
	}
	
	public function has_container()
	{
		return $this->container() != null;
	}
	
	public function container()
	{
		return $this->container;	
	}
	
	public function iscached()
	{
		return $this->delivery=='cache';	
	}
	
	public function cacheprofile($new)
	{
		if(!empty($new))
		{
			$this->cacheprofile = $new;
		}
		
		return $this->cacheprofile;	
	}
	
	public function cacheflags($new)
	{
		if(!empty($new))
		{
			$this->cacheflags = $new;
		}
		
		return $this->cacheflags;	
	}
	
	public function cachekey($new)
	{
		if(!empty($new))
		{
			$this->cachekey = $new;
		}
		
		return $this->cachekey;	
	}
	
	public function cachetime($new)
	{
		if(!empty($new))
		{
			$this->cachetime = $new;
		}
		
		return $this->cachetime;	
	}
	
	public function cachecontents($new)
	{
		if(!empty($new))
		{
			$this->cachecontents = $new;
		}
		
		return $this->cachecontents;	
	}
	
	public function inherits($new = null)
	{
		if($new!=null)
		{
			Jquarry_Pointer::inherits_singleton($this->name(), $new);
		}
		
		$ret = Jquarry_Pointer::inherits_singleton($this->name());
		
		if($ret==null)
		{
			$ret = array();
		}
		
		return $ret;
	}

	
}
