<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Database wrapper for mongo
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/mongo/database.php
 * @package    	JQuarry
 * @category   	Mongo
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Mongo_Database {
	
	protected static $instance;
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	
	public static function instance()
	{
		return isset(Mongo_Database::$instance) ? 
			Mongo_Database::$instance : 
			Mongo_Database::$instance = new Mongo_Database();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected $connection;
	protected $db;
	
	protected function __construct()
	{
		$this->connection = new Mongo();
		$this->db = $this->connection->jquarry;
	}
	
	public function get_collection($collection_name)
	{
		return $this->db->$collection_name;
	}
	
	public function __call($method, $arguments)
	{
		return Tools_Php::wrap_call_user_func_array($this->db, $method, $arguments);
	}
		
}
