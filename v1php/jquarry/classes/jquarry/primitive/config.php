<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Config - generic wrapper which ends up with an object as the config
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/primitives/config.php
 * @package    	JQuarry
 * @category   	primitives
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Primitive_Config extends Jquarry_Primitive_Object {
	
	protected function process_value()
	{
		if(is_string($this->value))
		{
			// is it a filepath?
			if(preg_match('/^\//', $this->value))
			{
				$this->value = Jquarry_Primitive::factory('file', $this->value);
				
				$this->process_value();
			}
			// is it XML string data
			else if(preg_match('/^\s*</', $this->value))
			{
				$xml = simplexml_load_string($this->value);
				
				$this->value = Tools_Php::simpleXMLToObject($xml);
			}
			// is it JSON config
			else if(preg_match('/^\s*\{/', $this->value))
			{
				$this->value = Tools_Php::decode_json($this->value, $this->_filename);
			}
		}
		// if we have an array we are assuming a key/value array
		else if(is_array($this->value))
		{
			$this->value = Tools_Php::convert_array_to_object($this->value);
		}
		else if(is_object($this->value))
		{
			// its a file object - load the content
			if(is_a($this->value, Jquarry_Primitive::classname('file')))
			{
				$this->_filename = $this->value->fullpath();
				
				$this->value = $this->value->get_contents();
				
				$this->process_value();	
			}
			// its a data object - grab its value
			else if(is_a($this->value, Jquarry_Primitive::classname('object')))
			{
				$this->value = $this->value->value();	
			}
		}
	}
}
