<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Selector Splitter Stage Descendant - splitter to anything below
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/query/selectorstage/splitter/descendant.php
 * @package    	JQuarry
 * @category   	query
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Query_Selectorstage_Splitter_Descendant extends Jquarry_Query_Selectorstage_Splitter {
	
	public function direction()
	{
		return 1;
	}
	
	public function depth()
	{
		return null;
	}
	
}
