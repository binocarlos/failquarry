<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * general tools for widgets
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/widget.php
 * @package    	JQuarry
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Widget {
	
	// extracts an array of widget names from the query string
	public static function query()
	{
		$query = $_SERVER['QUERY_STRING'];
		$widgets = array();
		
		if(preg_match('/widgets?=([\.\w,]+)/', $query, $matches))
		{
			$query = $matches[1];
		}
		
		$queryparts = explode(',', $query);
		
		foreach($queryparts as $querypart)
		{
			$querypart = preg_replace('/[^\w\.]/', '', $querypart);
			
			if(!empty($querypart))
			{
				$widgets[] = $querypart;
			}
		}
		
		return $widgets;
	}
}
