<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry View Component - a page component that is allowed to render it's content into a Jquarry view
 *
 *
 *
 * 
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/components/view.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Component_View extends Jquarry_Component_Page {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type helpers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_view()
	{
		return true;
	}
	
	
}
