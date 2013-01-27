<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Query Results - represents the nodes grabbed out of the database
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/nodecolletion.php
 * @package    	JQuarry
 * @category   	query
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Nodecollection {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function factory($nodes)
	{
		return new Jquarry_Nodecollection($nodes);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected $nodes = array();
	
	protected function __construct($nodes = array())
	{
		$this->nodes = $nodes;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * ACCESS
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function nodes()
	{
		return $this->nodes;
	}
	
	public function node($index = 0)
	{
		return $this->nodes[$index];
	}
	
	public function at($index = 0)
	{
		return $this->node($index);
	}
	
	public function length()
	{
		return count($this->nodes);	
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * MERGE
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function append($what)
	{
		if(is_array($what))
		{
			foreach($what as $node)
			{
				$this->nodes[] = $node;
			}
		}
		else if(is_object($what))
		{
			if(is_a($what, 'Jquarry_Nodecollection'))
			{
				$this->append($what->nodes());
				return;
			}
			else if(is_a($what, 'Jquarry_Node'))
			{
				$this->nodes[] = $what;
			}
		}	
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * JSON
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function json_array($asstring = false)
	{
		$arr = array();
		
		foreach($this->nodes as $node)
		{
			$arr[] = $node->to_json();
		}
		
		$ret = $arr;
		
		if($asstring)
		{
			$ret = JSON::str($ret);
		}
		
		return $ret;
	}
}
