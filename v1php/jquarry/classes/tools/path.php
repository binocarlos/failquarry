<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * general tools for paths
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/path.php
 * @package    	Widgetcloud
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Path {
	
	// looks after leading and trailing slashes so we never get // in a filepath
	public static function join_fileparts($first, $second)
	{
		return preg_replace('/\/$/', '', $first).'/'.preg_replace('/^\//', '', $second);
	}
	
	public static function get_classname($path, $prepend = null)
	{
		if(!empty($prepend)) { $path = $prepend.'.'.$path; }
		
		$path = 'jquarry.'.$path;
		
		$parts = explode('.', $path);
		
		$newparts = array();
				
		foreach($parts as $part)
		{
			$newparts[] = ucfirst($part);
		}
				
		$final_classname = implode('_', $newparts);
		
		return $final_classname;
	}
	
	public static function drill_set($node, $field, $newvalue = null)
	{
		if($newvalue == null) { return null; }

		if(is_object($node))
		{
			$node->$field = $newvalue;
		}
		else if(is_array($node))
		{
			$node[$field] = $newvalue;
		}
		
		return $node;
	}
	
	public static function drill_get($node, $field)
	{
		if(empty($field)) { return null; }
		
		if(is_object($node))
		{
			return $node->$field;
		}
		else if(is_array($node))
		{
			return $node[$field];
		}
		
		return null;
	}
	
	public static function drill_insert($node, $field)
	{
		if(empty($field)) { return null; }
		
		if(is_object($node))
		{
			$node->$field = new StdClass();
			return $node->$field;
		}
		else if(is_array($node))
		{
			$node[$field] = array();
			return $node[$field];
		}
		
		return null;
	}
	
	public static function drill_object($node, $path, $newvalue = null)
	{
		if(!isset($node)) { return null; }
		if(empty($path)) { return null; }
		
		if(!is_object($node)) { return null; }
			
		$path_parts = explode('.', $path);
		
		while(count($path_parts)>0)
		{
			$field = array_shift($path_parts);
			
			// its the last part
			if(count($path_parts)==0)
			{
				if($newvalue!=null)
				{
					Tools_Path::drill_set($node, $field, $newvalue);
				}
				
				$value = Tools_Path::drill_get($node, $field);
				
				return $value;
			}
			else
			{
				$newnode = Tools_Path::drill_get($node, $field);
				
				if(!isset($newnode) && $newvalue!=null)
				{
					$newnode = Tools_Path::drill_insert($node, $field);
				}
				else if(!isset($newnode))
				{
					return null;
				}
				
				$node = $newnode;
				
				if(!is_object($node)) { return $node; }
			}
		}
		
		return null;
	}
}
