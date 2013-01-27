<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Model representing an installation
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/installation.php
 * @package    	JQuarry
 * @category   	Installation
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Installation {
	
	protected static $instance;
	
	protected $id;
	protected $orm;
	
	protected function __construct()
	{
		if(empty($_SERVER['JQUARRY_INSTALLATION_ID']))
		{
			throw new Kohana_Exception("Jquarry_Installation requires the JQUARRY_INSTALLATION_ID environment variable to be set");
		}
		
		$this->id = $_SERVER['JQUARRY_INSTALLATION_ID'];
	}
	
	public static function instance()
	{
		return isset(Jquarry_Installation::$instance) ? 
			Jquarry_Installation::$instance : 
			Jquarry_Installation::$instance = new Jquarry_Installation();
	}
	
	public function id()
	{
		return $this->id;
	}
	
	public function load_orm()
	{
		return $this->orm ? $this->orm : $this->orm = ORM::factory('installation', $this->id());
	}
	
	public function name()
	{
		$this->load_orm();
		
		return $this->orm->loaded() ? $this->orm->name : 'no orm loaded';
	}
		
}
