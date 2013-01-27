<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Json Query - existing nodes (or partial nodes) inside JSON string
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
class Jquarry_Query_Json extends Jquarry_Query {
	
	public function run()
	{
		$factory = $this->storage_factory();
		
		$collection = $factory->run_json_query($this);
		
		return $collection;
	}
	
	protected function parse()
	{
		if(empty($this->query)) { return; }
		
		$this->config('data', Tools_Php::decode_json($this->query));
	}
	
	public function nodes_exist()
	{
		return true;
	}
	
}
