<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Registry entry class
 *
 * Wrapper for a node's presense in the registry - keeps track of children and such things
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/registryentry.php
 * @package    	JQuarry
 * @category   	registry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Registryentry {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function factory($node)
	{
		return new Jquarry_Registryentry($node);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected $node;
	
	protected function __construct($node)
	{
		$this->node = $node;
	}
	
	public function node()
	{
		return $this->node;
	}
	
}
