<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Directory Based Component - a component that has a 'home' folder containing files
 * this means it can open files and run views from them etc
 *
 * 
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/components/directorybased.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Component_Pageserving extends Jquarry_Component_Directorybased {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance Methods
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function process_url($url)
	{
		if(!preg_match('/\.\w+$/', $url)) { $url .= $this->config('index_page'); }
		
		if(!preg_match('/\.\w+$/', $url)) { $url .= Kohana::$config->load('jquarry.server.index_page'); }
		
		return $url;
	}
	
	// the hook to return page components from .htm file pointers
	protected function component_type_from_file_pointer($pointer)
	{
		// here we need to decide whether we want pages or views
		// pages are plain HTML - templates extend from these
		// views are processed HTML - webpages are these
		if(Tools_Mime::is_webpage($pointer->ext()))
		{
			// return 'page' if you don't want the HTML processed
			return 'view';
		}
		else if(Tools_Mime::is_image($pointer->ext()))
		{
			// return 'page' if you don't want the HTML processed
			return 'image';
		}
		
		return parent::component_type_from_file_pointer($pointer);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type helpers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_page_serving()
	{
		return true;
	}	
	
	
	
}
