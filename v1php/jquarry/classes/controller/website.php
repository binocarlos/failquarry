<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Admin Controller
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/controller/admin.php
 * @package    	JQuarry
 * @category   	Controller
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Controller_Website extends Controller_Base {
	
	
	
	
	public function action_index()
	{
		$this->action_router();
	}
	
	public function action_router()
	{
		$website = Jquarry_Component::factory('website');
		
		$server = Jquarry_Server::factory($website);
		
		$server->serve($this->param('url'));
	}
	
}