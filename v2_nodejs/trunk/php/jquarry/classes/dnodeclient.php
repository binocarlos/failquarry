<?php

// class to bootstrap the symphony dnode module
class Dnodeclient {

	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public static function factory()
	{
		$path = Kohana::$config->load('dnode.require');
		
		require($path);
		
		return new Dnodeclient();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected $dnode;
	protected $port;
	
	protected function __construct()
	{
		$this->servers = Kohana::$config->load('dnode.servers');
		$this->dnode = new DNode\DNode($this);
	}
	
	public function createInstallation($request)
	{
		$this->dnode->connect($this->servers['accountRegistry'], function($remote, $connection) use ($request) {
			
		    // Remote is a proxy object that provides us all methods
		    // from the server
		    $remote->runQuery($request, function($result) use ($connection) {
		    	
		        // Once we have the result we can close the connection
		        $connection->end();
		    });
		});
		
		return $this->_createInstallationAnswer;
	}
	
	public function createInstallationResponse($result)
	{
		$this->_createInstallationAnswer = $result;
	}
	
	/*
	public function testWebsiteRegistry()
	{
		$this->dnode->connect($this->servers['websiteRegistry'], function($remote, $connection) {
		    // Remote is a proxy object that provides us all methods
		    // from the server
		    $remote->getRoutingDecision(array(
		    
		    	'host' => 'bob.dev.jquarry.com',
		    	'path' => '/',
		    	'pathname' => '/',
		    	'query' => '',
		    	'search' => ''
		    
		    ), function($result) use ($connection) {
		    	
		        print_r($result);
		        
		        // Once we have the result we can close the connection
		        $connection->end();
		    });
		});		
	}
	*/
}