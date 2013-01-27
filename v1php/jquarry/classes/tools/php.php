<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * generall tools for php goodness
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/php.php
 * @package    	Widgetcloud
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Php {
	
	public static $dev = false;
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static functions
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public static function chomp($string)
	{
		$string = preg_replace('/^\s+/', '', $string);	
		$string = preg_replace('/\s+$/', '', $string);
		
		return $string;
	}
	
	public static function auto_convert($value)
	{
		if(!is_string($value)) { return $value; }
		
		// convert to integer (signed)
		if(preg_match('/^-?\d+$/', $value))
		{
			$value = (int) $value;
		}
		// convert to float (signed)
		else if(preg_match('/^-?\d*\.\d+$/', $value))
		{
			$value = (float) $value;
		}
		else if(preg_match('/^(true|false)$/', $value))
		{
			$value = (boolean) $value;
		}
		// todo date etc
		
		return $value;
	}
	
	public static function drill_array_set(array &$arr, $path, $val)
	{
		$loc = &$arr;
		foreach(explode('.', $path) as $step)
		{
			$loc = &$loc[$step];
		}
		return $loc = $val;
	}
	
	public static function drill_array_get($arr, $path, $val)
	{
		$path_parts = explode('.', $path);
		
		$current = $arr;
		
		while(count($path_parts)>0)
		{
			$field = array_shift($path_parts);
			
			if(empty($field)) { continue; }
			
			if(count($path_parts)==0)
			{
				return $current[$field];	
			}
			else
			{
				if(!isset($current[$field])) { return $field; }
				
				$current = $current[$field];
			}
		}
		
		return null;
	}
	
	public static function drill_object($obj, $path, $newvalue = null)
	{
		if(!is_object($obj))
		{
			throw new Kohana_Exception("Drill object requires an object");
		}
		
		if(empty($path))
		{
			return $obj;
		}
		
		$path_parts = explode('.', $path);
		
		$array_mode = is_array($obj);
		
		$currentvalue = $obj;
		
		while(count($path_parts)>0)
		{
			$field = array_shift($path_parts);
			
			if(empty($field)) { continue; }
			
			// its the last part
			if(count($path_parts)==0)
			{
				// we are writing the last part
				if($newvalue!==null)
				{
					$currentvalue->$field = $newvalue;
				}
				
				// we have written - return the value
				return $currentvalue->$field;
			}
			else
			{
				// get the next level in the sequence
				$nextvalue = $currentvalue->$field;
				
				
				// it is not there - take action
				if(!$nextvalue)
				{
					// we are not writing so just return nothing
					if($newvalue===null) { return null; }
					
					$currentvalue->$field = new stdClass();
				}
				
				$currentvalue = $nextvalue;	
			}
		}
		
		return null;
	}
	
	// basic flat copyer
	public static function copy_array($arr)
	{
		$ret = array();
		
		foreach($arr as $key => $val)
		{
			$ret[$key] = $val;
		}
		
		return $ret;
	}
	
	public static function clone_object($obj)
	{
		return self::convert_array_to_object($obj);
	}
	
	public static function convert_array_to_object($array) 
	{
		if(is_object($array)) { return $array; }
		
		return json_decode(json_encode($array));
	}
	
	public static function convert_object_to_array($object) 
	{
		if(is_array($object)) { return $object; }
		
		return json_decode(json_encode($object), true);
	}
	
	public static function serialize_object($obj)
	{
		return unserialize(serialize($obj));
	}
	
	public static function simpleXMLToObject(SimpleXMLElement $xml,$attributesKey=null,$childrenKey=null,$valueKey=null){
	
		$arr = self::simpleXMLToArray($xml, $attributesKey, $childrenKey, $valueKey);
		
		return self::convert_array_to_object($arr);
		
	}
	
	public static function MergeArrays($Arr1, $Arr2)
	{
	  foreach($Arr2 as $key => $Value)
	  {
	    if(array_key_exists($key, $Arr1) && is_array($Value))
	    
	    	if(Arr::is_assoc($Value))
	    	{
	      		$Arr1[$key] = self::MergeArrays($Arr1[$key], $Arr2[$key]);
	      	}
	      	else
	      	{
	      		$Arr1[$key] = array_merge($Arr1[$key], $Arr2[$key]);
	      	}
	
	    else
	      $Arr1[$key] = $Value;
	
	  }
	
	  return $Arr1;
	
	}

	
	public static function simpleXMLToArray(SimpleXMLElement $xml,$attributesKey=null,$childrenKey=null,$valueKey=null){ 

	    if($childrenKey && !is_string($childrenKey)){$childrenKey = '@children';} 
	    if($attributesKey && !is_string($attributesKey)){$attributesKey = '@attributes';} 
	    if($valueKey && !is_string($valueKey)){$valueKey = '@values';} 
	
	    $return = array(); 
	    $name = $xml->getName(); 
	    $_value = trim((string)$xml); 
	    if(!strlen($_value)){$_value = null;}; 
	
	    if($_value!==null){ 
	        if($valueKey){$return[$valueKey] = $_value;} 
	        else{$return = $_value;} 
	    } 
	
	    $children = array(); 
	    $first = true; 
	    foreach($xml->children() as $elementName => $child){ 
	        $value = self::simpleXMLToArray($child,$attributesKey, $childrenKey,$valueKey); 
	        if(isset($children[$elementName])){ 
	            if(is_array($children[$elementName])){ 
	                if($first){ 
	                    $temp = $children[$elementName]; 
	                    unset($children[$elementName]); 
	                    $children[$elementName][] = $temp; 
	                    $first=false; 
	                } 
	                $children[$elementName][] = $value; 
	            }else{ 
	                $children[$elementName] = array($children[$elementName],$value); 
	            } 
	        } 
	        else{ 
	            $children[$elementName] = $value; 
	        } 
	    } 
	    if($children){ 
	        if($childrenKey){$return[$childrenKey] = $children;} 
	        else{$return = array_merge($return,$children);} 
	    } 
	
	    $attributes = array(); 
	    foreach($xml->attributes() as $name=>$value){ 
	        $attributes[$name] = trim($value); 
	    } 
	    if($attributes){ 
	        if($attributesKey){$return[$attributesKey] = $attributes;} 
	        else{$return = array_merge($return, $attributes);} 
	    } 
	
	    return $return; 
	}
	
	public static function wrap_call_user_func_array($object, $method, $arguments)
	{
		$ret = null;
		
		switch(count($arguments)) { 
        	case 0: $ret = $object->$method(); break;
        	case 1: $ret = $object->$method($arguments[0]); break;
        	case 2: $ret = $object->$method($arguments[0], $arguments[1]); break;
        	case 3: $ret = $object->$method($arguments[0], $arguments[1], $arguments[2]); break;
        	case 4: $ret = $object->$method($arguments[0], $arguments[1], $arguments[2], $arguments[3]); break;
        	case 5: $ret = $object->$method($arguments[0], $arguments[1], $arguments[2], $arguments[3], $arguments[4]); break;
        	default: $ret = call_user_func_array(array($object, $method), $arguments);  break;
        }
        
        return $ret;
	}
	
	public static function devstats()
	{
		if(Tools_Dev::isproduction()) { return ''; }

		$view = View::factory('dev/stats');
		
		$load = sys_getloadavg();
		
		$view->load_average = number_format($load[0], 2).' / '.number_format($load[1], 2).' / '.number_format($load[2], 2);
		$view->memory_usage = number_format((memory_get_peak_usage() - KOHANA_START_MEMORY) / 1024, 2).'KB';
		$view->execution_time = number_format(microtime(TRUE) - KOHANA_START_TIME, 5).' seconds';
		
		return $view->render();
	}
	
	public static function decode_json($string, $filename = null)
	{
		$ret = JSON::decode($string);
		
		$error = null;
		
		switch(json_last_error())
        {
            case JSON_ERROR_DEPTH:
                $error =  ' - Maximum stack depth exceeded';
                break;
            case JSON_ERROR_CTRL_CHAR:
                $error = ' - Unexpected control character found';
                break;
            case JSON_ERROR_SYNTAX:
                $error = ' - Syntax error, malformed JSON';
                break;
            case JSON_ERROR_NONE:
            default:
                $error = '';                    
        }
        
        if (!empty($error))
            throw new Exception("JSON Error:{$filename} ".$error);
            
		return $ret;	
	}
	
}
