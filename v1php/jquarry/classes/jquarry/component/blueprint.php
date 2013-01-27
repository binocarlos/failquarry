<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Blueprint Component - file based component that uses the file as a config.json to configure the
 * blueprint with
 *
 *
 *
 * 
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/components/blueprint.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Component_Blueprint extends Jquarry_Component_Form {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type helpers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_blueprint()
	{
		return true;
	}
	
	// work out the classname for a new node based on
	public function node_classname()
	{
		return $this->config->get('classname');
	}
	
	public function node_type()
	{
		return $this->config->get('type');
	}
	
}
