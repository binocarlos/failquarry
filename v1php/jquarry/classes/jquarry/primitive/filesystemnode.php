<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Filesystemnode primitive - wrapper for a physical file system node (file or folder)
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/primitives/filesystemnode.php
 * @package    	JQuarry
 * @category   	primitives
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Primitive_Filesystemnode extends Jquarry_Primitive {
	
	public function fullpath()
	{
		return $this->value();
	}
	
	public function mtime()
	{
		return filemtime($this->fullpath());
	}

	public function exists()
	{
		return file_exists($this->fullpath());
	}
	
}
