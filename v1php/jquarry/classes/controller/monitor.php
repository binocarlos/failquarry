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
class Controller_Monitor extends Controller_Base {
	
	// lock this down for production innit
	protected $allow_web_browsing = true;
	
	public function before()
	{
		if (PHP_SAPI === 'cli' || $this->allow_web_browsing) 
		{
			parent::before();
		}
		else
		{
			echo 'cannot run this here';
			exit;
		}
	}
	
	public function action_index()
	{
		$this->action_inotify();
	}
	
	public function action_inotify()
	{
		$data = $this->param('data');
		
		if(!preg_match('/^(\w+):(.*?)$/', $data, $match))
		{
			echo 'invalid argument format';
			exit;
		}
		
		$action = $match[1];
		$filepath = Jquarry_Filestore::instance()->relative($match[2]);
		
		// grab special case top level files	
		if(preg_match('/^core\/\w\.\w[2,4]$/', $filepath, $match))
		{
			// do something here for top level files
		}
		else if(preg_match('/^core\/(.*?)$/', $filepath, $match))
		{
			$parts = explode('/', $match[1]);
			
			$type = $parts[0];
			$name = $parts[1];
			
			$component = Jquarry_Component::factory("{$type}[{$name}]");
			
			Jquarry_Componentcache::remove_component($component);

			echo 'done';
		}
		else
		{
			// do something here for other files (like authors)	
		}

	}
	
		
}