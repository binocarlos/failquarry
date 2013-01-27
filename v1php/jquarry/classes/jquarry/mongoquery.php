<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo Query - base class for Mongo complex queries
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mongoquery.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Mongoquery {
	
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
	
		'selectorstage' => 'read.selectorstage',
		
		'id' => 'read.id',
		
		'insert' => 'write.insert',
		
		'update' => 'write.update'
		
	);
	
	// return a new pointer
	public static function factory($name, $options)
	{
		$classname = self::classname($name);
		
		if(!class_exists($classname))
		{
			throw new Kohana_Exception("No mongo query with classname {$classname}");
		}
		
		$query = new $classname($options, $name);
		
		return $query;
	}
	
	
	protected static function classname($name)
	{
		$name = !empty(self::$classmap[$name]) ? self::$classmap[$name] : $name;
		
		$parts = explode('.', $name);
		
		$finalparts = array('Jquarry', 'Mongoquery');
		
		foreach($parts as $part)
		{
			$finalparts[] = ucfirst($part);
		}
		
		$classname = implode('_', $finalparts);
		
		return $classname;
	}
	
	// useful function for checking to see if we really need to make a sub-array for an $and or $or
	protected static function mongo_conditional($array, $operator = 'and')
	{
		if(!$array || count($array)<=0) { return array(); }
		
		if(count($array)==1) { return $array[0]; }
		
		return array(
		
			'$'.$operator => $array
		
		);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// the name of the query type
	protected $name;
	
	// all queries have an options variable that control what to do
	// this holds ids and other things needed for the query
	protected $options = null;
	
	protected $_required_options = array();
	
	protected function __construct($options = null, $name = null)
	{
		$this->name = $name;
		
		// default to blank options array
		$this->options = !empty($options) ? $options : array();
		
		$this->check_options();
	}
	
	// this will be overriden by the actual query class
	abstract public function run();
	
	// check that we have what need in the options array
	protected function check_options()
	{
		foreach($this->_required_options as $required)
		{
			if(!isset($this->options[$required]))
			{
				throw new Exception($this->name." needs a {$required} option");
			}
		}
	}
	
	
	
}
