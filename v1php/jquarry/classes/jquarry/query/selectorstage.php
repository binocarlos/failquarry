<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Selector Query - one part of an overall selector
 * this is the unit run against the database
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/query/selectorstage.php
 * @package    	JQuarry
 * @category   	query
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Query_Selectorstage {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// decides which selector stage to create based on the matching string
	public static function factory($sizzleinfo)
	{
		$special = $sizzleinfo["special"];
		
		// look for any of the splitters
		if(preg_match('/^(>|>>|<|<<|,)$/', $special))
		{
			return Jquarry_Query_Selectorstage_Splitter::factory($special);
		}
		else
		{
			return new Jquarry_Query_Selectorstage_Selector($sizzleinfo);
		}
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	
	
	protected function __construct()
	{
		
	}
	
	public function is_splitter()
	{
		return false;
	}
	
	public function is_selector()
	{
		return false;
	}
	
	public function is_phase_splitter()
	{
		return false;
	}
	
	
}
