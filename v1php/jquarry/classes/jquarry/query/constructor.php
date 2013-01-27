<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Constructor Query - query to make new things
 * expects the node type as the argument
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/query/selector.php
 * @package    	JQuarry
 * @category   	query
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Query_Constructor extends Jquarry_Query {
	
	protected $constructor = true;
	
	protected $_defaults = array(
	
		// the type of the new node
		'type' => 'node',
		
		// the initial values for the node
		'values' => array()
	
	);
	
	public function run()
	{
		$factory = $this->storage_factory();
		
		$collection = $factory->run_constructor_query($this);
		
		return $collection->at(0);
	}
	
	protected function parse()
	{
		if(empty($this->query)) { return; }
		
		// are we using <folder> syntax to make a new node?
		if(is_string($this->query))
		{
			if(preg_match('/^<([\w\.]+)(.*?)>$/', $this->query, $match))
			{
				$rawdata = Jquarry_Node::rawdata(array(
				
					"type" => $match[1],
					
					"values" => Tools_Jquarry::extract_args($match[2])
					
				));
				
				$this->config('data', array($rawdata));
			}
			else
			{
				throw new Kohana_Exception("{$this->query} is not a valid constructor query");	
			}
		}
		// no so we are assuming raw node data
		else if(is_object($this->query) || is_array($this->query))
		{
			// always ensure an array of raw data
			if(is_object($this->query))
			{
				$this->query = array($this->query);
			}
			
			$this->config('data', $this->query);
		}
	}
	
	public function nodes_exist()
	{
		return false;
	}
	
}
