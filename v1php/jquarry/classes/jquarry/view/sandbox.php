<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry View Sandbox - this is basically the Javascript interface
 *
 * anything exposed here is allowed access from javascript so this is the gatekeeper and be careful
 *
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/view/sandbox.php
 * @package    	JQuarry
 * @category   	view
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_View_Sandbox {
	
	// the view
	protected $view;
	
	// the output of the script
	protected $output;

	public function __construct($view)
	{
		$this->view = $view;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Page Tools
	 *
	 ********************************************************************************************************************************
	*/
	
	public function output($st)
	{
		$this->output .= $st;
		
		return $this->output;
	}
	
	public function debug($what)
	{
		$this->output .= print_r($what, true);
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * load profile - same as the profile constructor
	 *
	 * this is called from having hit a server side $import statement
	 *
	 * that server script will have been run from a view and therefore a context
	 *
	 * therefore we pass the context of the view to the profile load statement
	 *
	 ********************************************************************************************************************************
	*/
	
	public function loadProfile($profile, $location, $exclude)
	{
		$pointer = Jquarry_Pointer::factory($profile, $this->context());
		
		Jquarry_Profile::instance()->add($pointer, $location);
		
		// return the server files with source code to eval
		return Jquarry_Profile::instance()->serverjson(array(
			
			"source" => true,
				
			"exclude" => $exclude
				
		));
		
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * run some actions - the same as the actions controller
	 *
	 ********************************************************************************************************************************
	*/
	
	public function runActions($actions)
	{
		$status = array(
		
			'error' => false,
				
			'completed' => true,
			
			'data' => null
			
		);
		
		if(!Jquarry_Action::run($actions))
		{
			$status["error"] = true;	
			$status["completed"] = false;
		}
		
		return $status;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * run a selector query and return a json string of the results - the same as the query controller
	 *
	 ********************************************************************************************************************************
	*/
	
	public function runSelectorQuery($selector, $context_skeleton = null)
	{
		$query = Jquarry_Query::factory($selector, array(
		
			"context_skeleton" => $context_skeleton
		
		));
		
		$collection = $query->run();
		
		return $collection->json_array(true);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 *
	 * compiles a template and returns the result
	 * the template is living in the view
	 *
	 ********************************************************************************************************************************
	*/
	
	public function renderTemplate($name, $data)
	{
		$template = $this->view->get_template($name);
		
		if(!$template) { return ''; }
		
		return $template->render($data);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Internal Tools
	 *
	 ********************************************************************************************************************************
	*/
	
	// get the component that the script is executing within
	protected function context()
	{
		return $this->view->context();
	}
}
