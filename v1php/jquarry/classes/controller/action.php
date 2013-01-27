<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Action Controller - handles requests from client side jquarry to manipulate the server
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/controller/network.php
 * @package    	JQuarry
 * @category   	Controller
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Controller_Action extends Controller_Base {
	
	// keep the status ready to be returned via ajax
	protected $status = array(
		
		'error' => false,
			
		'completed' => true,
		
		'data' => null
			
	);
	
	public function action_index()
	{
		$this->action_run();
	}
	
	// this accetps an array of action json configs (or just a single one)
	// each one is run within the action factory
	public function action_run()
	{
		$status = Jquarry_Action::run($this->post('actions'));
		
		if(!$status)
		{
			$this->status["error"] = true;	
			$this->status["completed"] = false;
		}
		
		$this->json($this->status);
	}
	
}