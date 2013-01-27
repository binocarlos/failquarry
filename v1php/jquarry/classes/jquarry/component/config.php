<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Config Component - file based component that uses the file as a config.json to configure the
 * component with - blueprints are examples of this (i.e. file based components that treat their file as a config)
 *
 *
 *
 * 
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/components/config.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Component_Config extends Jquarry_Component_Filebased {
	
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
		if(!preg_match('/\.json$/', $pointer->location()))
		{
			$pointer->location($pointer->location().'.json');
		}
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Config - we treat the file this component is based on as a json config file
	 * that is loaded into the components config - this is the same as a directory based component's config.json
	 * but the file the component points to is used as the config.json (blueprints are a good example)
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function load_config()
	{
		if(!$this->pointer()->exists()) { return; }
		
		return Jquarry_Primitive::factory('config', $this->pointer()->localpath());
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type helpers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_config()
	{
		return true;
	}
	
	
}
