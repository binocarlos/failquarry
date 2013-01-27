<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Wrapper for a node document in mongo
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/model/node.php
 * @package    	JQuarry
 * @category   	Mongo
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Model_Node extends Mongo_Document {
	
	public function exists()
	{
		if( ! isset($this->_object['_id']) || isset($this->_changed['_id']))
		{
			return false;
		}
		else
		{
			return true;
		}
	}
	
	public function rawdata()
	{
		return $this->_object;	
	}
	
	public function get($name)
	{
		return Tools_Php::drill_array_get($this->_object, $name);
	}
	
	// overriden set method
	public function set($name, $value)
	{
		$ret = parent::set($name, $value);
		
		Tools_Php::drill_array_set($this->_object, $name, $value);
		
		return $ret;
	}
}
