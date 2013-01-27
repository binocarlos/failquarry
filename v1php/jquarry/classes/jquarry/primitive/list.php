<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry List - wrapper for an array
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/primitive/list.php
 * @package    	JQuarry
 * @category   	primitives
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Primitive_List extends Jquarry_Primitive {
	
	protected function default_value()
	{
		return array();
	}
	
	protected function process_value()
	{
		if(!is_array($this->value))
		{
			$this->value = array($this->value);
	}

	
}
