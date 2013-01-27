<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Primitive - abstract class for all primitives
 *
 * primitives are basically wrappers for primitive values
 *
 * they all have a value and a config
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/primitive.php
 * @package    	JQuarry
 * @category   	primitives
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Primitive {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected static $_classname_shortcuts = array(
	
		'object' => 'object',
		
		'list' => 'list',
		
		'field' => 'field',
		
		
		'config' => 'config',
		
		'directory' => 'filesystem.directory',
		
		'file' => 'filesystem.file',
		
		
		'node' => 'node'
		
		
		
	);
	
	public static function factory($type, $value = null, $config = array())
	{
		$classname = self::classname($type);
		
		if($value!==null && is_a($value, $classname)) { return $value; }
		
		return new $classname($value, $config);
	
	}
	
	// gives you the classname for the given name of primitive
	public static function classname($type)
	{
		if(!self::$_classname_shortcuts[$type])
		{
			Tools_Dev::exception("Primitive: {$type} is not a valid primitive type");
		}
		
		$type = self::$_classname_shortcuts[$type] ? Jquarry_Primitive::$_classname_shortcuts[$type] : $type;
		
		$parts = explode('.', $type);
		$classparts = array();
		
		foreach($parts as $part)
		{
			$classparts[] = ucfirst($part);
		}
		
		$classname = 'Jquarry_Primitive_'.implode('_', $classparts);
		
		return $classname;
	}
	
	// shortcut to a file in the filestore
	public static function filestore($path)
	{
		$fullpath = Jquarry_Filestore::instance()->path($path);
		
		return self::factory('file', $fullpath);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// the actual value for the primitive
	protected $value;
	
	// put the defaults here - each override can choose to add some values
	// the internal options get merged
	protected $config = array(
	
	);
	
	public function __construct($value = null, $config = array())
	{
		$this->value = $value==null ? $this->default_value() : $value;
		$this->config = array_merge($this->config, $config);
		
		$this->process_value();
	}
	
	public function value($newvalue = null)
	{
		if(!empty($newvalue))
		{
			$this->value = $newvalue;
		}
		
		return $this->value;
	}
	
	public function config($key = null, $value = null)
	{
		if($key===null) { return $this->config; }
		
		return $value===null ? $this->config[$key] : $this->config[$key] = $value;	
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Value overrides
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// this should return the default value (if any) for this primitive (.e.g. new object or array etc)
	protected function default_value()
	{
		return null;	
	}
	
	// this should alter the initial value given to the constructor (if needed)
	protected function process_value()
	{
		
	}
	
	public function copy_config()
	{
		$ret = array();
		
		foreach($this->config as $key => $value)
		{
			$ret[$key] = $value;
		}
		
		return $ret;	
	}
}
