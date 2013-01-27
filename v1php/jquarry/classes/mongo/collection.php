<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Database wrapper for an installations collection
 * the installation id is combined with the collection name so each 
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/mongo/collection.php
 * @package    	JQuarry
 * @category   	Mongo
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Mongo_Collection {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public static function instance()
	{
		$classname = get_called_class();
		
		return isset(self::$instances[$classname]) ? 
			self::$instances[$classname] : 
			self::$instances[$classname] = new $classname();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	
	public $collection;
	protected $collection_name;
	
	protected static $instances = array();
	
	protected function __construct()
	{
		$db = Mongo_Database::instance();
		
		$this->collection = $db->get_collection($this->name());
	}
	
	public function name()
	{
		$installation = Jquarry_Installation::instance();
		
		return $this->collection_name.$installation->id();
	}
	
	// this is called with pure javascript i.e. not using the PHP API
	public function mapreduce($query, $map, $reduce)
	{
		$db = Mongo_Database::instance();
		
		$name = $this->name();
		
		$code=<<<EOT
	
	return db.runCommand({
		
		"mapreduce":"{$name}",
		"query":{$query},
		"map":{$map},
		"reduce":{$reduce},
		"out":{
			"inline":1
		}
		
	});
		
EOT;

		return $db->execute($code);
	}
	
	public function query($query, $fields = array())
	{
		$cursor = null;
		
		if(count($fields)>0)
		{
			$cursor = $this->collection->find($query, $fields);
		}
		else
		{
			$cursor = $this->collection->find($query);
		}

		$ret = array();
		
		foreach ($cursor as $obj)
		{
			$ret[] = $obj;
		}
		
		return $ret;
	}
	
	public function __call($method, $arguments)
	{
		return Tools_Php::wrap_call_user_func_array($this->collection, $method, $arguments);
	}
		
}
