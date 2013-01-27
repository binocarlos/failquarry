<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Directory - wrapper for a physical file system folder
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/primitives/filesystem/directory.php
 * @package    	JQuarry
 * @category   	primitives
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Primitive_Filesystem_Directory extends Jquarry_Primitive_Filesystemnode {
	
	public function filepath($append = null)
	{
		$path = $this->fullpath();
		
		if(!empty($append))
		{
			if(!preg_match('/^\/', $append))
			{
				$append = '/'.$append;
			}
			
			$path .= $append;
		}
		
		return $path;
	}
	
	public function listfiles($config = array())
	{		
		$results = array();
		
		if ($handle = opendir($this->fullpath()))
		{
		    while (false !== ($file = readdir($handle)))
		    {
		        // if file isn't this directory or its parent, add it to the results
	      		if ($file == "." or $file == "..") { continue; }
	      		
	      		$parts = explode('.', $file);
	      		
	      		$ext = $parts[count($parts)-1];
	      		
	      		if($config["ignore"] && $config["ignore"][$file]) { continue; }
	      		if($config["filter"] && !$config["filter"][$ext]) { continue; }
	      		
	        	$results[] = $file;
		    }
		    
		    closedir($handle);
		}
		
		return $results;
	}
	
	public function get_file_contents($filename)
	{
		if(empty($filename)) { return null; }
		
		$file = $this->get_file($filename);
		
		if($file->exists())
		{
			return $file->get_contents();
		}
		else
		{
			return null;
		}
	}
	
	public function get_file($filename)
	{
		$config = $this->copy_config();
		
		$config["file"] = $filename;
		
		$file = Jquarry_Primitive::factory('file', $this->filepath($filename), $config);
		
		return $file;
	}
	
	public function get_file_objects($config = array())
	{
		$files = array();
		$filenames = $this->listfiles($config);	
		
		foreach($filenames as $filename)
		{
			$files[] = $this->get_file($filename);
		}
		
		return $files;
	}
}
