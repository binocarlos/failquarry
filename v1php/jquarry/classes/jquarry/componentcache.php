<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Looks after saving components into memcached
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/componentcache.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Componentcache {
	
	// turn the whole thing off
	protected static $active = false;
	
	// this means don't read but do write
	protected static $rebuild = false;
	
	public static function canread()
	{
		return self::$active && !self::$rebuild;
	}
	
	public static function canwrite()
	{
		return self::$active;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected static function engine()
	{
		$engine = Kohana::$config->load('jquarry.default_cache_engine');
		
		return Cache::instance(!empty($engine) ? $engine : 'file');
	}
	
	protected static function get($name)
	{
		if(!self::$active || self::$rebuild) { return; }
		
		$engine = self::engine();
		
		try
		{
			return $engine->get($name);
		}
		catch (Cache_Exception $e)
		{
     		return null;
		}
	}
	
	protected static function set($name, $value)
	{
		if(!self::$active) { return; }
		
		$engine = self::engine();
		
		try
		{
			return $engine->set($name, $value);
		}
		catch (Cache_Exception $e)
		{
     		return null;
		}
	}

	
	protected static function delete($name)
	{
		if(!self::$active) { return; }
		
		$engine = self::engine();
		
		try
		{
			return $engine->delete($name);
		}
		catch (Cache_Exception $e)
		{
     		return null;
		}
	}
	
	protected static function name($name, $prepend)
	{
		$ret = empty($prepend) ? '' : $prepend;
		
		$ret .= $name;
		
		$ret = preg_replace('/\W/', '', $ret);
		
		return $ret;
	}
	
	public static function pointerid($pointer)
	{
		if(is_string($pointer)) { return $pointer; }
		
		return self::name($pointer->name(), 'component');
	}
	
	protected static function profileid($pointer, $location)
	{
		return self::name($pointer->id().$location, 'profile');
	}
	
	protected static function save_component_info($pointer, $data)
	{
		if(!self::$active) { return; }
		
		self::delete(self::pointerid($pointer));
		self::set(self::pointerid($pointer), $data);
		
		self::ensure_inherits($pointer);
	}
	
	protected static function ensure_component_info($pointerid)
	{
		$pointerid = self::pointerid($pointerid);
		
		$info = self::get($pointerid);
		
		if(!$info)
		{
			$info = array(
			
				// a serialized version of the actual object
				"object" => null,
				
				// a list of the profiles this component is holding in the cache
				"profiles" => array(
				
					"client" => array(),
					
					"server" => array()
					
				),
				
				// a list of the other components that should be removed if this one is removed
				"cascade_delete" => array()
				
			);
			
			self::set($pointerid, $info);
		}
		
		return $info;
	}
	
	
	public static function ensure_inherits($pointer)
	{
		$dependant_id = self::pointerid($pointer);
		
		// so - this inherits from that - so make a record for that so if it changes to delete this
		foreach($pointer->inherits() as $inherit_pointer)
		{
			$master_info = self::ensure_component_info($inherit_pointer);
			
			$master_info["cascade_delete"][$dependant_id] = true;
			
			self::save_component_info($inherit_pointer, $master_info);
			
			self::ensure_inherits($inherit_pointer);
		}
	}
	
	public static function remove_component($pointer)
	{
		if(!self::$active) { return; }
		
		if(empty($pointer)) { return; }
		
		$id = self::pointerid($pointer);
		
		$info = self::ensure_component_info($id);
		
		foreach($info["cascade_delete"] as $componentname => $val)
		{
			self::remove_component($componentname);
		}
		
		self::delete($id);
	}
	
	
	public static function setobject($pointer, $config)
	{
		if(!self::$active) { return; }
		
		$info = self::ensure_component_info($pointer);
		
		$info["object"] = $config;
		
		self::save_component_info($pointer, $info);
	}
	
	public static function getobject($pointer)
	{
		if(!self::$active || self::$rebuild) { return; }
		
		$info = self::ensure_component_info($pointer);
		
		return $info["object"];
	}
	
	public static function getprofile($pointer, $location, $profileid)
	{
		if(!self::$active || self::$rebuild) { return; }
		
		if(empty($profileid)) { $profileid = 'default'; }
		
		$info = self::ensure_component_info($pointer);
		
		return $info["profiles"][$location][$profileid];
	}
	
	public static function setprofile($pointer, $location, $profileid, $data)
	{
		if(!self::$active) { return; }
		
		if(empty($profileid)) { $profileid = 'default'; }
		
		$info = self::ensure_component_info($pointer);
		
		$info["profiles"][$location][$profileid] = $data;
		
		self::save_component_info($pointer, $info);
	}
	
	public static function getrawprofile($cachekey, $profilename, $location)
	{
		if(!self::$active) { return; }
		
		if(empty($profilename)) { $profilename = 'default'; }
		
		$info = self::get($cachekey);
		
		if(!$info) { return; }
		
		return $info["profiles"][$location][$profilename];
	}
}
