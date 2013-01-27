<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * general tools for the filesystem
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/filesystem.php
 * @package    	JQuarry
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Filesystem {
	
	// get an array of what is inside a directory
	public static function directoryToArray($directory, $recursive)
	{
	    $array_items = array();
	    if ($handle = opendir($directory)) {
	        while (false !== ($file = readdir($handle))) {
	            if ($file != "." && $file != "..") {
	                if (is_dir($directory. "/" . $file)) {
	                    if($recursive) {
	                        $array_items = array_merge($array_items, directoryToArray($directory. "/" . $file, $recursive));
	                    }
	                    $file = $directory . "/" . $file;
	                    $array_items[] = preg_replace("/\/\//si", "/", $file);
	                } else {
	                    $file = $directory . "/" . $file;
	                    $array_items[] = preg_replace("/\/\//si", "/", $file);
	                }
	            }
	        }
	        closedir($handle);
	    }
	    return $array_items;
	}
}
