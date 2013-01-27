<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * generall tools for Kohana Request
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/tools/request.php
 * @package    	jquarry
 * @category   	Tools
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Request {
	
	public static function hostname() 
	{
		return $_SERVER['HTTP_HOST'];
	}
	
	public static function sslhostname()
	{
		return (self::ssl() ? 'https://' : 'http://').self::hostname();
	}
	
	public static function ssl()
	{
		if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443)
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	
	// takes a url and adds the hostname with ssl http(s) tings
	public static function url($url)
	{
		return (self::ssl() ? 'https://' : 'http://').self::hostname().$url;
	}
	
	public static function get($name) 
	{
		$req = Request::current();
		
		return $req->query($name);
	}
	
	public static function post($name) 
	{
		$req = Request::current();
		
		return $req->post($name);
	}
	
	public static function param($name) 
	{
		$req = Request::current();
		
		return $req->param($name);
	}
	
	public static function redirect($to) 
	{
		$req = Request::current();
		
		return $req->redirect($to);
	}
	
	public static function body($content) 
	{
		$res = Request::current()->response();
		
		return $res->body($content);
	}
	
	public static function headers($name, $value)
	{
		$res = Request::current()->response();
		
		$res->headers($name, $value);
	}
	
	public static function header404($to) 
	{
		$res = Request::current()->response();
		
		return $res->status(404);
	}
	
	public static function error($text) 
	{
		$res = Request::current()->response();
		
		$res->body($text);
		
		$res->status(500);
		
		$res->send_headers();
		
		exit;
	}
	
	
}
