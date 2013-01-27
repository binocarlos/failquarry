<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * generall tools for dev goodness
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/dev.php
 * @package    	Widgetcloud
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Dev {
	
	public static $devflag = false;
	
	public static function exception($st)
	{
		throw new Kohana_Exception($st);
	}
	
	public static function isproduction()
	{
		return Kohana::$environment===Kohana::PRODUCTION;
	}
	
	public static function start()
	{
		self::$devflag = true;
	}
	
	public static function stop()
	{
		self::$devflag = false;
	}
	
	public static function do_print_r($what, $exit)
	{
		if(!self::$devflag) { return; }
		
		print_r($what);
		
		if($exit)
		{
			self::do_exit();
		}
	}
	
	public static function do_exit()
	{
		if(!self::$devflag) { return; }
		
		exit();
	}
}
