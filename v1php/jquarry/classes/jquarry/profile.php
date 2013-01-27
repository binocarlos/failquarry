<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Profile - a wrapper for some files that need to be included from a component
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/profile.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Profile {
	
	// singleton
	protected static $instance;
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Factory
	 *
	 * 
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public static function instance()
	{
		return isset(self::$instance) ? 
			self::$instance : 
			self::$instance = self::factory();
	}
	
	public static function factory()
	{
		return new Jquarry_Profile();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	
	
	// the client profilecollection
	protected $client;
	
	// the server profilecollection
	protected $server;
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Make a client and server collection
	 * These will hold the files needed for each of those locations once we have processed any additions
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function __construct()
	{
		$this->client = new Jquarry_Profilecollection('client');
		$this->server = new Jquarry_Profilecollection('server');
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Add a profile - the query is an absolute component path (e.g. widget:tree:/edit)
	 *
	 * The file part of the component path (:/edit) is the name of the profile that is matched
	 * against the 'name' property of each import object in the config of a component (this is matched with a regular expression)
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// this is called with a given context and a page name
	//
	// if the page name is a pointer to another component we deal with that
	public function add($pointer, $location = null)
	{
		if(is_string($pointer))
		{
			$delimeter = Kohana::$config->load('jquarry.profile.key_delimeter');
			
			$parts = explode($delimeter, $pointer);
			
			foreach($parts as $part)
			{
				$this->add(Jquarry_Pointer::factory($part), $location);	
			}
			
			return;
		}
		
		if($location==null || $location=='both' || $location=='server')
		{
			$this->server->add($pointer);
		}
			
		if($location==null || $location=='both' || $location=='client')
		{
			$this->client->add($pointer);
		}	
	}
	
	// return a string for a clients keys
	public function keys()
	{	
		$keys = $this->client->components($config);

		$delimeter = Kohana::$config->load('jquarry.profile.key_delimeter');
		
		return implode($delimeter, $keys);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Get a profile's files for the client or the server
	 *
	 *
	 ********************************************************************************************************************************
	*/

	//
	public function json($config = array())
	{
		if(empty($config["location"]))
		{
			throw new Kohana_Exception("Profile->json requires a location in its config");
		}
		
		return $config["location"]=="client" ? $this->client->json($config) : $this->server->json($config);
	}
	
	// shortcut to json
	public function serverjson($config = array())
	{
		$config["location"] = "server";
		
		return $this->json($config);
	}
	
	// shortcut to json
	public function clientjson($config = array())
	{
		$config["location"] = "client";
		
		return $this->json($config);
	}
	
	//
	public function get($config = array())
	{
		if(empty($config["location"]))
		{
			throw new Kohana_Exception("Profile->get requires a location in its config");
		}
		
		return $config["location"]=="client" ? $this->client->get($config) : $this->server->get($config);
	}
	
	// shortcut to get
	public function server($config = array())
	{
		$config["location"] = "server";
		
		return $this->get($config);
	}
	
	// shortcut to get
	public function client($config = array())
	{
		$config["location"] = "client";
		
		return $this->get($config);
	}
}
