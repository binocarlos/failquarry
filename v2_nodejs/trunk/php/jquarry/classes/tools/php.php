<?php defined('SYSPATH') or die('No direct script access.');
/**
 * @class Tools.PHP
 * @filename   	classes/tools/php.php
 * @package    	tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * php tools
 *
 */

class Tools_PHP {
	
	public static function to_object($arr)
	{
		return json_decode(json_encode($arr));
	}
	
	// Pretty print some JSON 
	public static function json_format($json) 
	{ 
	    $tab = "  "; 
	    $new_json = ""; 
	    $indent_level = 0; 
	    $in_string = false; 
	
		if(is_string($json)) {
	    	$json_obj = json_decode($json); 
	
	    	if($json_obj === false) 
		        return false; 
		}
		else
		{
			$json_obj = $json;
		}
	
	    $json = json_encode($json_obj); 
	    $len = strlen($json); 
	
	    for($c = 0; $c < $len; $c++) 
	    { 
	        $char = $json[$c]; 
	        switch($char) 
	        { 
	            case '{': 
	            case '[': 
	                if(!$in_string) 
	                { 
	                    $new_json .= $char . "\n" . str_repeat($tab, $indent_level+1); 
	                    $indent_level++; 
	                } 
	                else 
	                { 
	                    $new_json .= $char; 
	                } 
	                break; 
	            case '}': 
	            case ']': 
	                if(!$in_string) 
	                { 
	                    $indent_level--; 
	                    $new_json .= "\n" . str_repeat($tab, $indent_level) . $char; 
	                } 
	                else 
	                { 
	                    $new_json .= $char; 
	                } 
	                break; 
	            case ',': 
	                if(!$in_string) 
	                { 
	                    $new_json .= ",\n" . str_repeat($tab, $indent_level); 
	                } 
	                else 
	                { 
	                    $new_json .= $char; 
	                } 
	                break; 
	            case ':': 
	                if(!$in_string) 
	                { 
	                    $new_json .= ": "; 
	                } 
	                else 
	                { 
	                    $new_json .= $char; 
	                } 
	                break; 
	            case '"': 
	                if($c > 0 && $json[$c-1] != '\\') 
	                { 
	                    $in_string = !$in_string; 
	                } 
	            default: 
	                $new_json .= $char; 
	                break;                    
	        } 
	    } 
	
	    return $new_json; 
	} 
}