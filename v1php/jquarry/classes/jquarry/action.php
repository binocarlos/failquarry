<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Action - a wrapper for a request made from a jquarry page to manipulate the server somehow
 *
 * this can be triggered from client or server side code 
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/action.php
 * @package    	JQuarry
 * @category   	save
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Action {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected static $actions = array(
	
		'save' => 'save',
		
		'insert' => 'save',
		
		'update' => 'save'
	
	);
	
	public static function run($actions)
	{
		if(is_string($actions))
		{
			$actions = Tools_Php::decode_json($actions);
		}
		
		if(is_object($actions))
		{
			$actions = array($actions);
		}
		
		if(!is_array($actions)) { return; }
		
		foreach($actions as $actionconfig)
		{
			if(!($status = self::runaction($actionconfig->name, $actionconfig->data)))
			{
				return $status;
			}
		}
		
		return true;
	}
	
	protected static function runaction($name, $data)
	{
		$action = self::factory($name, $data);
		
		return $action->doaction();
	}
	
	protected static function factory($name, $data)
	{
		$classname = self::get_classname($name);
		
		return new $classname($name, $data);
	}
	
	protected static function get_classname($name)
	{
		$name = isset(self::$actions[$name]) ? self::$actions[$name] : $name;
		
		$parts = explode('.', $name);
		
		$final_parts = array('Jquarry', 'Action');
		
		foreach($parts as $part)
		{
			$final_parts[] = ucfirst($part);
		}
		
		return implode('_', $final_parts);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// the original data that needs to be saved
	protected $data;
	
	// the action name
	protected $name;
	
	// the errors that were found
	protected $errors = array();
	
	protected function __construct($name, $data)
	{
		$this->name = $name;
		$this->data = $data;
	}
	
	protected function error($st)
	{
		$this->errors[] = $st;
	}
	
	// this is called to commit the data to the db
	abstract protected function doaction();
	
}
