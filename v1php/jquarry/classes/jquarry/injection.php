<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Injection - handles injecting resources into a browser
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/injection.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Injection {
	
	// converts an action name into an injection url
	// so jquarry becomes /inject/jquarry.js
	//
	// this is used with a kohana bootstrap to map to the injection controller
	//
	// it also adds the current time for cache busting (the bootstrap copes with this)
	protected function url($action)
	{
		return '/inject/'.time().'/'.$action.'.js';
	}
	
	// this accepts the output from a components render and attemtps to insert
	// a script tag pointing to /inject/jquarry.js?libs
	//
	// the libs are a result of the current profile
	public function bake_script_tag($html)
	{
		// first lets check to see if we have not been told to have jquarry client in our profile
		// but yet there is a quarry script in there somewhere
		
		// get the keys for the current profile
		$profile_keys = Jquarry_Profile::instance()->keys();
		
		// get the placeholder script
		$placeholder_script_url = $this->url('placeholder');
		
		$placeholder_tag=<<<EOT
	
<script type="text/javascript" src="{$placeholder_script_url}"></script>	
		
EOT;
		
		// add them for the jquarry main load request
		$jquarry_script_url = $this->url('jquarry').'?'.$profile_keys;
		
		// make the jquarry main load request script tag
		$jquarry_tag=<<<EOT
	
<script type="text/javascript" src="{$jquarry_script_url}"></script>	
		
EOT;

		// lets see if we have a head tag to append to
		if(preg_match('/<head(.*?)>/i', $html, $match))
		{
			$html = str_replace($match[0], $match[0].$tag, $placeholder_tag);
		}
		// if we have not found a head - lets try the body
		else if(preg_match('<body(.*?)>/i', $html, $match))
		{
			$html = str_replace($match[0], $tag.$match[0], $placeholder_tag);
		}
		// otherwise just stick it at the start
		else
		{
			$html = $placeholder_tag.$html;
		}
		
		return $html.$jquarry_tag;
	}
	
	public function render_placeholder()
	{
		$js = Jquarry_Primitive::filestore('system/injection/placeholder.js');
		
		return $js->get_contents();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Render the require.js bootstrap for the client
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function render_client()
	{
		$view = View::factory("injection/client");
		
		$client_requires = Jquarry_Profile::instance()->client();
	}
	
	public function render_clientOLD()
	{
		$view = View::factory("injection/client");
		
		$client_requires = Jquarry_Profile::instance()->client();
		
		print_r($client_requires);
		exit;
		
		
		$view->inline_javascripts = $this->convert_pointers_to_urls(Jquarry_Profile::instance()->client(array(
		
			"delivery" => "inline",
			
			"filter" => array(
			
				"js" => true
				
			)
		
		)));
		
		$view->profile_json = Jquarry_Profile::instance()->clientjson(array(
		
			
		
		));
		
		$view->production = Tools_Dev::isproduction();
		$view->hostname = Tools_Request::sslhostname();
		
		return $view->render();
	}
	
	public function render_server()
	{
		$view = View::factory("injection/bootstrap");
		
		$view->profile_json = Jquarry_Profile::instance()->serverjson();
		
		$view->production = Tools_Dev::isproduction();
		$view->hostname = Tools_Request::sslhostname();
		
		return $view->render();
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * File array tools
	 *
	 ********************************************************************************************************************************
	*/
	
	// this basically asks the profile for client side files and turns them into URLs
	protected function convert_pointers_to_urls($pointers)
	{
		$arr = array();
		
		foreach($pointers as $pointer)
		{
			$arr[] = $pointer->url();	
		}
		
		return $arr;
	}
	
	// this basically asks the profile for client side files and turns them into URLs
	protected function convert_pointers_to_localpaths($pointers)
	{
		$arr = array();
		
		foreach($pointers as $pointer)
		{
			$arr[] = $pointer->localpath();	
		}
		
		return $arr;
	}
	
	
	protected function convert_pointers_to_contents($pointers)
	{
		$arr = array();
		
		foreach($pointers as $pointer)
		{
			$arr[] = array(
			
				"file" => $pointer->localpath(),
				
				"source" => $pointer->get_contents()
				
			);
		}
		
		return $arr;
	}
	
		
}
