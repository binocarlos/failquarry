<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Profile collection - keeps track of the profile assets that are required for one location
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/profilecollection.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Profilecollection {
	
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// are we running in dev mode - this is set by the env variable
	protected $production = true;
	
	// are we running in the context of the client or the server
	protected $location = 'server';
	
	// keep track of the order in which components were added to the profile (important to maintain load order)
	protected $components = array();
	
	// map of component key (e.g. core:widget:tree:/edit or core:widget:tree)
	// onto files used in that profile
	protected $files = array(
	
		
		
	);
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Create a new profile collection with it's location (client or server)
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function __construct($location)
	{
		if(empty($location))
		{
			throw new Kohana_Exception("Profilecollection requires a location");
		}
		
		$this->production = Tools_Dev::isproduction();
		$this->location = $location;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Process the config passed to the getter functions
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function process_config($config)
	{
		// check if the excludes is a string split by comma
		if(isset($config["exclude"]) && is_string($config["exclude"]))
		{
			$config["exclude"] = explode(',', $config["exclude"]);
		}
		
		if(isset($config["exclude"]) && is_array($config["exclude"]) && !Arr::is_assoc($config["exclude"]))
		{
			$exclude = array();
			
			foreach($config["exclude"] as $comp)
			{
				$exclude[$comp] = true;
			}
			
			$config["exclude"] = $exclude;
		}
		
		return $config;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Keys - get the array of included component profiles
	 *
	 ********************************************************************************************************************************
	*/
	
	public function components($config = array())
	{
		$config = $this->process_config($config);
		
		$ret = array();
		
		foreach($this->components as $componentname)
		{
			if(isset($config["exclude"]) && isset($config["exclude"][$componentname])) { continue; }
			
			$ret[] = $componentname;
		}
		
		return $ret;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Get files from the profile collection - loops through each component (in order) - checks the config and adds files accordingly
	 *
	 * the config can contain:
	 *
	 *	delivery (inject|inline)
	 *	filter (array of extensions we want)
	 *	exclude (array map of component profiles we have already loaded)
	 *
	 * returns an array of file primitives
	 *
	 ********************************************************************************************************************************
	*/
	
	public function get($config = array())
	{
		$config = $this->process_config($config);
		
		$ret = array();
		
		foreach($this->components as $componentname)
		{
			// have we already loaded this component (we we don't want it anymore)
			if(isset($config["exclude"]) && isset($config["exclude"][$componentname])) { continue; }
			
			// loop through the files for the component and include them if they pass the checks
			foreach($this->files[$componentname] as $pointer)
			{
				// if we have a filter check that the file is in it
				if(isset($config["filter"]) && !isset($config["filter"][$pointer->ext()])) { continue; }
				
				// if we are after a specific delivery type then check the file is set for that (this is assigned below in process_import)
				if(isset($config["delivery"]))
				{
					// catch the special case where we have jquarry in the cache and we want it deliveried inline
					if($config["delivery"]=="inline" && $pointer->delivery()=='cache' && $pointer->cacheflags()=='jquarry' && $config["location"]=='client')
					{
						// this means jquarry has been found and it is cached - we want to include
						// it if we are on the client and we want inline files (because it is cached it wouldn't hit otherwise)	
					}
					else if ($config["delivery"]!=$pointer->delivery())
					{
						// this is the normal check to say the delivery filter has not matched
						continue;
					}
				}
				
				$ret[] = $pointer;
			}
		}
		
		return $ret;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Gives you a json representation of this profile based on the config you give
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function json($config)
	{
		$config = $this->process_config($config);
		
		$files = array();
		
		foreach($this->components as $componentname)
		{
			// have we already loaded this component (we we don't want it anymore)
			if(isset($config["exclude"]) && isset($config["exclude"][$componentname])) { continue; }
			
			$filearray = array();
			
			foreach($this->files[$componentname] as $pointer)
			{
				// if we have a filter check that the file is in it
				if(isset($config["filter"]) && !isset($config["filter"][$pointer->ext()])) { continue; }
				
				// if we are after a specific delivery type then check the file is set for that (this is assigned below in process_import)
				if(isset($config["delivery"]) && $config["delivery"]!=$pointer->delivery()) { continue; }
			
				// now we choose what we want back as the file itself
				// if we are asking for server then we want the source code of the file
				// if we are asking for client then we want a url to it
				$filearray[] = array(
				
					"delivery" => $pointer->delivery(),
					
					"cacheflags" => $pointer->cacheflags(),
					
					"ext" => $pointer->ext(),
					
					"url" => $pointer->url(),
					
					"source" => $config["source"]==true ? $pointer->get_contents() : "",
					
					"name" => $pointer->file()
					
				);
				
				
			}
			
			$files[$componentname] = $filearray;
		}
		
		$ret = array(
		
			"components" => $this->components($config),
			
			"files" => $files
			
		);
		
		return json_encode($ret);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Deals with adding component profiles to the cache
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function getcache($component)
	{
		if(!Jquarry_Componentcache::canread()) { return null; }
		
		return Jquarry_Componentcache::getprofile($component->pointer(), $this->location, $component->pointer()->file());
	}
	
	protected function setcache($component, $data)
	{
		if(!Jquarry_Componentcache::canwrite()) { return null; }
		
		// a map of the various sourcecode types (js, css, htm, json)
		$ext_sources = array();
		
		foreach($data["files"] as $filepointer)
		{
			$ext_sources[$filepointer->ext()] .= $filepointer->get_contents()."\n";	
		}
		
		$cachekey = Jquarry_Componentcache::pointerid($component->pointer());
		
		$data["files"] = array();
		
		$delivery = $component->is_jquarry() ? 'inline' : 'cache';
		$cacheflags = $component->is_jquarry() ? 'jquarry' : '';
		if($ext_sources["js"])
		{
			// JavaScript
			$jsmin = Minify::factory('js')->set( $ext_sources["js"] )->min();
			
			$jspointer = clone $component->pointer();
			
			$jspointer->file($cachekey.'.js');
			$jspointer->delivery('cache');
			$jspointer->cachekey($cachekey);
			$jspointer->cacheprofile($component->pointer()->file());
			$jspointer->cachefile($cachekey.'.js');
			$jspointer->cachetime(time());
			$jspointer->cacheflags($cacheflags);
			$jspointer->cachecontents($jsmin);
		
			$data["files"][] = $jspointer;
		}
		
		if($ext_sources["css"])
		{
			// CSS
			$cssmin = Minify::factory('css')->set( $ext_sources["css"] )->min();
			
			$csspointer = clone $component->pointer();
			
			$jspointer->file($cachekey.'.css');
			$csspointer->delivery('cache');
			$csspointer->cachekey($cachekey);
			$csspointer->cacheprofile($component->pointer()->file());
			$csspointer->cachefile($cachekey.'.css');
			$csspointer->cachetime(time());
			$jspointer->cacheflags($cacheflags);
			$csspointer->cachecontents($cssmin);
			
			$data["files"][] = $csspointer;
		}
		
		return Jquarry_Componentcache::setprofile($component->pointer(), $this->location, $component->pointer()->file(), $data);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Add a pointer to a component profile view - the string passed to the profile is a component pointer
	 * and this is the processed array version of that (see Jquarry_Component::process_pointer)
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function add($pointer)
	{
		// if we have a container then we want to use that one for the profiles
		// i.e. this page of that website rather than it being a single file being added
		if($pointer->has_container())
		{
			$pointer = $pointer->container();
		}
		
		// get the actual component we are adding
		$component = $pointer->component();
		
		$profilename = $pointer->file();
		
		// we have already added this profile
		if($this->files[$pointer->id()]) { return; }
		
		// now lets see if we have this profile in the cache
		if($component->should_cache())
		{
			$existing = $this->getcache($component);
			
			// we have a cached version
			if($existing)
			{
				// don't do any further processing now
				$should_process = false;
				
				foreach($existing["components"] as $componentpointername => $val)
				{
					$componentpointer = Jquarry_Pointer::factory($componentpointername, $component);
					
					$this->add($componentpointer);
				}
				
				$this->files[$pointer->id()] = $existing["files"];
				$this->components[] = $pointer->id();
				
				// we are all done now because the cache dealt with it
				return;
			}
		}
				
		$import = $this->process_import(array(
			
			"component" => $component, 
			
			// pointer file represents the name of the profile we are after
			// this can be the webpage name or any other 'view' within the component
			// this file may not exist - it may be just a name that the profile can match
			// against to include files (i.e. $import("widget[somewidget]->somenonexistentview"))
			// this would import the files that matched 'somenonexistentview' even though the file isn't there
			"profilename" => $pointer->file(),
				
			"imports" => $component->get_profile_imports()
				
		));
		
		$this->files[$pointer->id()] = $import["files"];
		
		// add the component in order
		$this->components[] = $pointer->id();
		
		// if we are here then lets insert into the cache
		if($component->should_cache())
		{
			$this->setcache($component, $import);
		}
		
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Process a single list of imports in the context of a component
	 * this is recursive - if it finds an object with an import property it triggers the process_import again passing the properties onwards
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function process_import($config = array())
	{
		$imports = $config["imports"];
		$component = $config["component"];
		$delivery = $config["delivery"];
		$profilename = $config["profilename"];
		
		$empty = array(
			"files" => array(),
			"components" => array()
		);
		
		// make sure we have what we need
		if(empty($imports)) { return $empty; }
		if(!$component) { return $empty; }
		
		if(is_string($imports) || is_object($imports))
		{
			$imports = array($imports);
		}
		
		$files = array();
		$components = array();
		
		foreach($imports as $import)
		{
			if(is_string($import))
			{
				if($import=='<file>')
				{
					$import = $profilename;
				}
				
				$filepointer = Jquarry_Pointer::factory($import, $component);
				
				// are we pointing to a file within the existing component
				// or have we hit a reference to another component
				if($filepointer->is_for_component($component))
				{
					print_r($filepointer);
					exit;
					if($filepointer->exists())
					{
						$filepointer->delivery($delivery);
			
						$files[] = $filepointer;
					}
				}
				else
				{
					$components[$filepointer->id()] = true;
					
					$this->add($filepointer);
				}
			}
			else if(is_array($import))
			{
				$new_config = Tools_Php::copy_array($config);
				
				$new_config["imports"] = $import;
				
				$sub = $this->process_import($new_config);
				
				$files = array_merge($files, $sub["files"]);
				$components = array_merge($components, $sub["components"]);
			}
			else if(is_object($import))
			{
				$profile = $import;
				
				// the name in the profile is used as a regular expression
				// we will replace the following:
				//
				// . -> \.
				//
				// * -> .*?
				//
				// 
				//
				if(!empty($profile->name))
				{
					$regexp = $profile->name;
					
					$regexp = preg_replace('/\./', '\\.', $regexp);
					$regexp = preg_replace('/\*/', '.*?', $regexp);
					
					if(!preg_match('/^'.$regexp.'/', $profilename))
					{
						continue;
					}
				}
				
				if(isset($profile->production))
				{
					if($this->production!=$profile->production)
					{
						continue;
					}
				}
				
				if(isset($profile->location))
				{
					if($this->location!=$profile->location)
					{
						continue;
					}
				}
				
				$new_config = Tools_Php::copy_array($config);
				
				$new_config["imports"] = $profile->import;
				
				if(isset($profile->delivery))
				{
					$new_config["delivery"] = $profile->delivery;		
				}
				
				$sub = $this->process_import($new_config);
				
				$files = array_merge($files, $sub["files"]);
				$components = array_merge($components, $sub["components"]);
			}
		}
		
		return array(
		
			"files" => $files,
			"components" => $components
			
		);
	}
	
			
}
