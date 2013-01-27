<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Page Component - a component that can be rendered as some HTML (basically a html file)
 *
 *
 *
 * 
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/components/page.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Component_Page extends Jquarry_Component_Filebased {
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type helpers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_page()
	{
		return true;
	}
	
}
