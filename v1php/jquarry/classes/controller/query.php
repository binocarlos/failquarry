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
class Controller_Query extends Controller_Base {
	
	public function action_index()
	{
		$this->action_query();
	}
	
	public function action_query()
	{
		$selector = $this->getpost(array('q', 'query'), true);
		$context_skeleton = $this->getpost(array('skeleton', 'context_skeleton'), false);
		
		$query = Jquarry_Query::factory($selector, array(
		
			'context_skeleton' => $context_skeleton
		
		));
		
		$collection = $query->run();
		
		$this->json($collection->json_array());
	}
	
	
}