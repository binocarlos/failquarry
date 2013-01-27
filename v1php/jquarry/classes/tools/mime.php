<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * general tools for mime types
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/mime.php
 * @package    	Widgetcloud
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Mime {
	
	protected static $exts = array(
	
		'webpage' => array(
		
			'htm' => true,
			'html' => true
		
		),
		
		'image' => array(
		
			'png' => true,
			'gif' => true,
			'jpg' => true
		
		)
	
	);
	
	public static function is_webpage($ext)
	{
		return self::$exts['webpage'][strtolower($ext)];	
	}
	
	public static function is_image($ext)
	{
		return self::$exts['image'][strtolower($ext)];	
	}
}
