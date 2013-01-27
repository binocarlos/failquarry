<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * generall tools for jquarry
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/jquarry.php
 * @package    	jquarry
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Jquarry {
	
	public static $dev = false;
	
	public static function quarry_url() 
	{
		$quarry_file = Jquarry_Primitive::factory('file', 'core/jquarry/jquarry.js');
		
		return $quarry_file->route('/inject/jquarry.js');
	}
	
	public static function scripttag()
	{
		return '<script src="'.self::script().'"></script>'."\n";
	}
	
	public static function script()
	{
		return self::quarry_url();
	}
	
	public static function base_javascript_array()
	{
		return Kohana::$config->load('jquarry.jsapi.base');
	}
	
	public static function server_javascript_array()
	{
		return Kohana::$config->load('jquarry.jsapi.server');
	}
	
	public static function client_javascript_array()
	{
		return Kohana::$config->load('jquarry.jsapi.client');
	}
	
	public static function server_javascripts()
	{
		return array_merge(Tools_Jquarry::base_javascript_array(), Tools_Jquarry::server_javascript_array());
	}
	
	public static function client_javascripts()
	{
		return array_merge(Tools_Jquarry::base_javascript_array(), Tools_Jquarry::client_javascript_array());
	}
	
	public static function regexp($name) {
	
		$regexps = Kohana::$config->load('jquarry.regexps');
		
		$reg = $regexps[$name];
		
		if(is_array($reg))
		{
			$reg = implode('', $reg);
		}
		
		return $reg;	
		
	}
	
	public static function strip_quotes($string)
	{
		$string = preg_replace('/^["\']*/', '', $string);
		$string = preg_replace('/["\']*$/', '', $string);
		
		return $string;
	}
	
	public static function extract_args($string, $defaults = array())
	{
		$arr = array();
		
		if(preg_match_all(self::regexp("args"), $string, $matches, PREG_SET_ORDER))
		{
			foreach($matches as $match)
			{
				if(!empty($match[1]))
				{
					$arr[strtolower($match[1])] = $match[2];
				}
			}
		}
		
		return array_merge($defaults, $arr);
	}
	
	public static function extract_jquarry_args($string)
	{
		$arr = array();
		
		if(preg_match_all(self::regexp("jquarryargs"), $string, $matches, PREG_SET_ORDER))
		{
			foreach($matches as $match)
			{
				if(!empty($match[1]))
				{
					$arr[] = array(
					
						"field" => $match[1],
						
						"operator" => $match[2],
						
						"value" => self::strip_quotes($match[3])
					);
				}
				
				$string = str_replace($match[0], '', $string);
			}
		}
		
		
		if(preg_match('/\[(([\w\.]+\s*)+)\]/', $string, $match))
		{
			$parts = preg_split('/\s+/', $match[1]);
			
			foreach($parts as $part)
			{
				if(empty($part)) { continue; }
				
				$arr[] = array(
					
					"field" => $part,
						
					"operator" => "exists"
						
				);
			}
		}
				
		return $arr;
	}
	
}
