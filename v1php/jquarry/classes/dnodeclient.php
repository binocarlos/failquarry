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
		$path = Kohana::$config->load('jquarry.dnode.require_path');
		
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
		$this->port = Kohana::$config->load('jquarry.dnode.port');
		$this->dnode = new DNode\DNode();
	}
	
	public function run()
	{
		$this->dnode->connect($this->port, function($remote, $connection) {
		    // Remote is a proxy object that provides us all methods
		    // from the server
		    $remote->zing(33, function($n) use ($connection) {
		        echo "n = {$n}\n";
		        // Once we have the result we can close the connection
		        $connection->end();
		    });
		});		
	}
}