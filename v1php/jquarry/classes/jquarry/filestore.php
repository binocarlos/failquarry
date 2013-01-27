<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Utility class for accessing the filestores (core / authors / user)
 *
 * Singleton
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/filestore.php
 * @package    	JQuarry
 * @category   	Filestore
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Filestore {
	
	// the config local folder for the filestore
	protected $rootfolder;
	
	// the apache alias pointing into the filestore
	protected $alias;
	
	// singleton
	protected static $instance;
	
	protected function __construct()
	{
		// the physical folder for the filestore
		$this->rootfolder = Kohana::$config->load('jquarry.filestore.folder');
		
		// the apache alias that maps onto the filestore
		$this->alias = Kohana::$config->load('jquarry.filestore.alias');
	}
	
	public static function instance()
	{
		return isset(Jquarry_Filestore::$instance) ? 
			Jquarry_Filestore::$instance : 
			Jquarry_Filestore::$instance = new Jquarry_Filestore();
	}
	
	public function rootfolder()
	{
		return $this->rootfolder;
	}

	// turn a full path into a relative one
	public function relative($fullpath)
	{
		return str_replace($this->rootfolder.'/', '', $fullpath);
	}
	
	public function path($path)
	{
		return $this->rootfolder.'/'.$path;
	}
	
	// useful function that adds the file modified time onto a url so whenever the file changes it's URL
	// changes and we don't need to worry about bleeding proxies, browser caches and other annoying gremlins
	// 
	public function url($url, $mtime = null)
	{
		if($mtime!=null)
		{
			$url = $mtime.'/'.$url;
		}
		
		return Tools_Request::url($this->alias.'/'.$url);
	}
	
}
