<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Application Controller
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/controller/application.php
 * @package    	JQuarry
 * @category   	Controller
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Controller_Application extends Controller_Base {
	
	public function action_index()
	{
		$this->action_router();
	}
	
	public function action_router()
	{
		$application_id = $this->param('application');
		$application_url = preg_replace('/^\//', '', $this->param('url'));
		
		$application = Jquarry_Component::factory("application[{$application_id}]");
		
		$server = Jquarry_Server::factory($application);
		
		$server->serve($application_url);
	}
	
}