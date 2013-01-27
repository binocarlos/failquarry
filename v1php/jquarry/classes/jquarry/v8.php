<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry V8 - singleton v8 engine loaded with goodness
 *
 * this is not quite a singleton - sometimes we want to run another v8 from within an existing one and doing that
 * with the same v8 object is a mind mush
 *
 * so - each v8 knows if it is currently executing script
 *
 * if instance() is called and the current instance is busy - we will make a new one
 *
 * once a v8 has finished executing - it will remove itself but the first one is always left
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/v8.php
 * @package    	JQuarry
 * @category   	view
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_V8 extends V8 {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected static $instances = array();
	
	public static function factory()
	{
		return new Jquarry_V8();
	}
	
	public static function instance()
	{
		$free_v8 = count(self::$instances) > 0 ? self::$instances[count(self::$instances)-1] : null;
		
		// either we dont have a v8 or the most recent v8 is still running so we need a new one
		if($free_v8==null || $free_v8->running)
		{
			$new_v8 = self::factory();
			
			self::$instances[] = $new_v8;
			
			return $new_v8;
		}
		
		//we have a v8 that is not running - lets clean up
		
		$newarr = array();
		
		for($i=0; $i<count(self::$instances); $i++)
		{
			$check_v8 = self::$instances[$i];
			
			if($i==0 || $check_v8->running)
			{
				$newarr[] = $check_v8;
			}
		}
		
		self::$instances = $newarr;
		
		return $free_v8;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// keep track of the server side scripts we have imported
	protected $loaded = array();
	
	// load up the server side jquarry code
	protected function init()
	{
		$this->import_profile();
	}
	
	protected function import_profile()
	{
		// make sure that jquarry server is always pre-loaded
		Jquarry_Profile::instance()->add('framework[jquarry]', 'server');
		
		$files = Jquarry_Profile::instance()->server();
		
		$sandbox = new Jquarry_View_Sandbox();

		foreach($files as $pointer)
		{
			if($pointer->is_js())
			{
				$this->import_javascript_file($pointer, $component, $sandbox);
			}
		}
		
		$injection = new Jquarry_Injection();
		
		$init_script = $injection->render_server();
	
		if(!$this->run($init_script, array("sandbox" => $sandbox), 'init.js'))
		{
			throw new Exception($this->errorMessage());
		}
	}
	
	protected function import_javascript_file($pointer, $component = null, $sandbox)
	{
		$source = '';
		$id = '';
		
		if($pointer->iscached())
		{
			if($this->loaded[$pointer->cachekey()]) { return; }
			
			$this->loaded[$pointer->cachekey()] = $pointer;
			
			$source = $pointer->cachecontents();
			$id = $pointer->cachekey();
		}
		else
		{
			if($this->loaded[$pointer->localpath()]) { return; }
			
			$this->loaded[$pointer->localpath()] = $pointer;
			
			$source = $pointer->get_contents();
			
			$id = $pointer->id();
	
			if(!$pointer->exists())
			{
				throw new Exception("{$id} does not exist");
			}
		}

		if(empty($source)) { return; }
				
		if(!$this->run($source, array("sandbox" => $sandbox), $id))
		{
			throw new Exception($this->errorMessage());
		}
	}

}
