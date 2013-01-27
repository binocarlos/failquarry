<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Object - wrapper for an object tree (a StdClass data structure)
 *
 * this uses deep nesting - so you can say value('level1.level2.level3');
 *
 * if you are writing and level2 does not exist - then it will create a new StdClass in it's place
 *
 * subclasses can override the create_blank_value method to decide what should be created in blank space
 *
 * equally they can override the value method to decide what should be returned from a get
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/primitives/object.php
 * @package    	JQuarry
 * @category   	primitives
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Primitive_Object extends Jquarry_Primitive {
	
	// keep track of the fields that have changed
	protected $_changed = array();
	
	protected function default_value()
	{
		return new StdClass();	
	}
	
	protected function process_value()
	{
		if(is_array($this->value))
		{
			$this->value = Tools_Php::convert_array_to_object($this->value);
		}
	}

	// returns a new primitives object
	public function merge(Jquarry_Primitives_Object $with)
	{
		$thisarr = Tools_Php::convert_object_to_array($this->value());
		$thatarr = Tools_Php::convert_object_to_array($with->value());
		
		$margedarr = Tools_Php::MergeArrays( $thisarr, $thatarr );
		
		return Jquarry_Primitive::factory('object', Tools_Php::convert_array_to_object($margedarr));
	}
	
	
	
	public function get($path)
	{
		return $this->data($path);
	}
	
	public function has($path)
	{
		$check = $this->data($path);
		
		return !empty($check);
	}
	
	public function set($path, $value, $ignoredirty = false)
	{
		return $this->data($path, $value, $ignoredirty);
	}
	
	public function has_changed()
	{
		return count($this->_changed) > 0;	
	}
	
	public function data($path, $newvalue = null, $ignoredirty = false)
	{
		if(empty($path))
		{
			return $this->value;
		}
		
		if($newvalue!==null && !$ignoredirty)
		{
			$this->_changed[$path] = true;
		}
		
		$path_parts = explode('.', $path);
		
		$currentvalue = $this->value;
		
		while(count($path_parts)>0)
		{
			$field = array_shift($path_parts);
			
			if(empty($field)) { continue; }
			
			// its the last part
			if(count($path_parts)==0)
			{
				// we are writing the last part
				if($newvalue!==null)
				{
					$currentvalue->$field = $newvalue;
				}
				
				// we have written - return the value
				return $currentvalue->$field;
			}
			else
			{
				// get the next level in the sequence
				$nextvalue = $currentvalue->$field;
				
				// it is not there - take action
				if(!$nextvalue)
				{
					// we are not writing so just return nothing
					if($newvalue===null) { return null; }
					
					// we are writing so create a new value and continue
					$currentvalue->$field = $nextvalue = $this->default_value();
				}
				
				$currentvalue = $nextvalue;	
			}
		}
		
		return null;
	}
	
	/*
	public function __call($field, $newvalue = null)
	{
		return $this->value($field, $newvalue);
	}
	
	public function __get($field)
	{
		return $this->value($field, $newvalue);
	}
	
	public function __set($field, $newvalue = null)
	{
		return $this->value($field, $newvalue);
	}
	
	public function __unset($field)
	{
		unset($this->data->$field);
	}
	*/
}
