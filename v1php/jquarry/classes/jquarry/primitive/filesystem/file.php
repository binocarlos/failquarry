<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry File - wrapper for a physical file system file
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/primitives/filesystem/file.php
 * @package    	JQuarry
 * @category   	primitives
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Primitive_Filesystem_File extends Jquarry_Primitive_Filesystemnode {
	
	public function get_contents($ensure_exists = false)
	{
		$ret = file_exists($this->fullpath()) ? file_get_contents($this->fullpath()) : null;
		
		if($ensure_exists && $ret===null)
		{
			throw new Kohana_Exception("Filestore: file does not exist: {$fullpath}");
		}
		
		return $ret;
	}
	
	public function mimetype()
	{
		return File::mime_by_ext($this->ext());
	}
	
	public function is_ext($ext)
	{
		return strtolower($ext)==strtolower($this->ext());
	}
	
	public function ext()
	{
		$parts = explode('.', $this->fullpath());
		
		return strtolower(array_pop($parts));
	}
	
}
