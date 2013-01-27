<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Id Query - query to grab a node by it's main id
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/query/id.php
 * @package    	JQuarry
 * @category   	query
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Query_Id extends Jquarry_Query {
	
	public function run()
	{
		$factory = $this->storage_factory();
		
		return $factory->run_id_query($this);
	}
	
	protected function parse()
	{
		if(empty($this->query)) { return; }
		
		// are we using <folder> syntax to make a new node?
		if(is_string($this->query))
		{
			if(preg_match('/^id\((\w+)\)$/', $this->query, $match))
			{
				$this->config('id', $match[1]);
			}
			else
			{
				throw new Kohana_Exception("{$this->query} is not a valid id query");	
			}
		}
		else
		{
			throw new Kohana_Exception("{$this->query} is not a valid id query");
		}
	}
	
	public function nodes_exist()
	{
		return true;
	}
	
}
