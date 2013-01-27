<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * V8 - wrapper for the javascript engine - can be overriden for preloaded wrappers (like jQuarry server side)
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
class V8 {
	
	// the actual v8 object
	protected $v8;
	
	// keeps track of the last error to happen
	protected $error;
	
	// keeps track of the result from the last script
	protected $result;
	
	// keeps track of the exception from the last script
	protected $exception;
	
	// are we currently running javascripts?
	protected $running = false;
	
	public function __construct()
	{
		$this->v8 = new V8Js();
		
		$this->init();
	}
	
	// load up and initialize the javascript environment
	protected function init()
	{
		
	}
	
	// run some text as javascript through the v8
	// this returns true|false as to whether there was an error
	// the result and error text are stored in their variables
	
	public function run($script, $variables = array(), $name = 'main.js')
	{
		// reset the error so the new script can flag one
		$this->error = null;
		
		// reset the error so the new script can flag one
		$this->result = null;
		
		foreach($variables as $prop => $value)
		{
			$this->v8->$prop = $value;	
		}
		
		try {
			
			$this->running = true;
			$this->result = $this->v8->executeString($script, $name);
			$this->running = false;
			
		} catch (V8JsException $e) {
			
			$this->running = false;
			$this->error = $e->getMessage();
			$this->exception = $e;
			
			return false;
			
		}
		
		return true;
	}
	
	public function errorMessage()
	{
		if(!$this->exception) { return ''; }
		
		return $this->exception->getMessage().": ".$this->exception->getJsSourceLine();
	}
	
	public function result()
	{
		return $this->result;
	}
	
	public function error()
	{
		return $this->error;	
	}
	
	public function exception()
	{
		return $this->exception;	
	}
	
	
}
