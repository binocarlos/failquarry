<?php defined('SYSPATH') or die('No direct script access.');
/**
 * @class Controller.Website
 * @extends Controller.Base
 * @filename   	classes/controller/website.php
 * @package    	controllers
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * Website Controller - takes URLs from websites and serves them
 *
 */

class Controller_Adminbase extends Controller_Base {
	
	protected function trigger_website_update()
	{
		$client = Amqpclient::factory();
		$client->send(array(
		
			'exchange' => 'admin',
			
			'routingKey' => 'website',
			
			'message' => array(
			
				'instruction' => 'clearWebsiteCache'
				
			)
		
		));
	}
	
	public function action_saveinstallation()
	{
		$id = $this->post('id');
		$name = $this->post('name');
		$root = $this->post('root');
		$websites = $this->post('websites');
		
		$installation = ORM::factory('installation', $id);
		
		$installation->name = $name;
		$installation->root = $root;
		$installation->websites = $websites;
		
		$installation->save();
		
		$this->trigger_website_update();
		
		$this->json(array(
			"done" => true
		));
	}
	
	/**
	 * Main page - calls the router
	 */
	public function action_installations()
	{
		$installationarray = ORM::factory('installation')->find_all();
		
		$json = array();
		
		foreach($installationarray as $installation)
		{
			$json[] = $installation->json();
		}
		
		$this->json($json);
	}
	
}