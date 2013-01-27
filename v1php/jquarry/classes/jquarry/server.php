<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Server - this is the wrapper for serving component pages
 *
 *
 *
 * 
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/server.php
 * @package    	JQuarry
 * @category   	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Server {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// return a new pointer
	public static function factory($component)
	{
		return new Jquarry_Server($component);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected $component;
	
	protected function __construct($component)
	{
		if($component==null)
		{
			throw new Kohana_Exception("Jquarry_server needs a component");
		}
		
		$this->component = $component;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Websites
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function serve($url = null)
	{
		// if this returns true then we are finished here
		if($this->serve_special_page($url))
		{
			return;
		}
		
		// get the component for the file being requested - this will be a file/directory based component
		$resource = $this->component->spawn_component($url);
		
		if(!$resource->exists())
		{
			$this->serve_404($resource);
			
			return;
		}
		
		$this->serve_resource($resource);
	}
	
	protected function serve_404($resource)
	{
		Tools_Request::header404();
		
		if($resource->is_page())
		{
			$this->serve_special_page(':404');
		}
	}
	
	protected function serve_resource($resource)
	{
		if($resource->is_page())
		{
			$this->serve_page($resource);
		}
		else
		{
			$this->serve_file($resource);
		}
	}
	
	protected function serve_page($page)
	{
		$html = '';
		
		if($page->is_view())
		{
			$html =  $page->render();
			
			$injection = new Jquarry_Injection();
			
			$html = $injection->bake_script_tag($html);
			
			$html = Tools_Php::devstats().$html;
		}
		else
		{
			$html = $page->contents();
		}

		Tools_Request::body($html);
	}
	
	// this serves an non-parsed file (such as an image)
	protected function serve_file($resource)
	{
		$file = $resource->file();

		Tools_Request::headers('content-type', $file->mimetype());
		
		Tools_Request::body($file->get_contents());
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Page Tools
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function serve_special_page($url)
	{
		$special = $this->get_special_page_contents($url);
		
		if($special!=null)
		{
			Tools_Request::body(Tools_Php::devstats().$special);
			
			return true;
		}
		
		return false;
	}
	
	// special pages trigger Kohana views that can automatically generate HTML pages
	// this avoids the file based cascade for components
	//
	// a special page is of the format :pagename e.g. :about :help
	//
	// returns null if it is not a special page
	protected function get_special_page_contents($page)
	{
		if(preg_match('/^:(\w+)$/', $page, $match))
		{
			$page = $match[1];
			
			$view = View::factory('component/special/'.$page);
			
			$view->component = $this;
			
			return $view->render();
		}
		
		return null;
	}
	
	

	
}
