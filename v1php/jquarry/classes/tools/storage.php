<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * general tools for storage
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/storage.php
 * @package    	JQuarry
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Storage {
	
	// provides a new guid using mongo
	public static function id()
	{
		$id = new MongoId();
		
		return ''.$id;
	}
}
