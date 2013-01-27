<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Inject Controller - handles injecting javascripts
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/controller/inject.php
 * @package    	JQuarry
 * @category   	Controller
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Controller_Inject extends Controller_Base {
	
	public function action_index()
	{
		$this->action_inject();
	}
	
	public function action_jquarry()
	{
		$this->action_inject();
	}
	
	public function action_inject()
	{
		$libs = $this->getpost('libs', true);
		
		Jquarry_Profile::instance()->add($libs);
		
		// make a new injection object passing the query string or libs parameter for what libraries to include
		$injection = new Jquarry_Injection();
		
		$this->inject($injection->render_client());
	}
	
	public function action_placeholder()
	{
		$injection = new Jquarry_Injection();
		
		$this->javascript($injection->render_placeholder());
	}
	
	public function action_profile()
	{
		// get the list of libraries we want a profile for
		$libs = $this->post('libs');
		
		// get a list of the libraries we have already loaded and want to ignore
		$exclude = $this->post('exclude');
		
		Jquarry_Profile::instance()->add($libs);
		
		$this->json(Jquarry_Profile::instance()->clientjson(array(
		
			"exclude" => $exclude
		
		)));
		
	}
	
	
	
}