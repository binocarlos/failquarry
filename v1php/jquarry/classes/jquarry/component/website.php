<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Directory Based Component - a component that has a 'home' folder containing files
 * this means it can open files and run views from them etc
 *
 * 
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/components/directorybased.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Component_Website extends Jquarry_Component_Pageserving {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Methods
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected static function do_process_pointer($pointer)
	{
		$drive = $pointer->drive();
		
		// lets check to see if we don't have a drive - in which case set it to the sepcial documentroot: drive
		if(empty($drive) && !$pointer->is_default())
		{
			$pointer->drive('documentroot');
		}
	}
	
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance Methods
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	
	
	
	
}
