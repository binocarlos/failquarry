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
 * @filename   	classes/jquarry/components/form.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Component_Form extends Jquarry_Component_Config {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type helpers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_form()
	{
		return true;
	}
	
}
