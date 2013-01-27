<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Memory Factory - uses the nodes in the registry for the given query
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/storage/memory/factory.php
 * @package    	JQuarry
 * @category   	storage factory
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Storage_Memory_Factory extends Jquarry_Storage_Factory {
	
	// key used for abstract factory
	protected $type = 'memory';
	
	/**
	 ********************************************************************************************************************************
	 *
	 * id query - grabs a new new based on its main id
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function run_id_query(Jquarry_Query_Id $query)
	{
		if(empty($query))
		{
			throw new Exception("Query must be defined to call run in storage factory");
		}
		
		$node = $query
		
		$rawdata = $this->id_query_data($query);
		
		return $this->build_collection($rawdata, $query);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * id
	 *
	 *
	  ********************************************************************************************************************************
	*/
	
	// hits mongo with a specific id to load
	protected function id_query_data($query)
	{
		$id = $query->config("id");
		
		$query = Jquarry_Mongoquery::factory('id', array(
		
			'id' => $id
			
		));
		
		return $query->run();
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * selector
	 * this is the main part where it looks at a selector stage and translates it onto database queries
	 *
	  ********************************************************************************************************************************
	*/
	
	
	
	// return an array of raw data for nodes
	
	protected function selector_stage_data($config = array())
	{
		// the selector stage containing the query info we want to select
		$selector_stage = $config["selector_stage"];
		
		// the previous collection that was built using the last stage
		$previous_collection = $config["previous_collection"];
		
		// the splitter between the previous collection and this query
		// i.e. how do we apply the previous tree encodings to this query
		$splitter = $config["splitter"];
		
		// are we on the last stage and want all data or just the _meta for further stages
		$skeleton = $config["skeleton"];
		
		$previous_nodes;
		
		$query = Jquarry_Mongoquery::factory('selectorstage', array(
		
			'selector_stage' => $selector_stage,
			
			'skeleton' => $skeleton,
			
			'previous_collection' => $previous_collection,
			
			'splitter' => $splitter
			
		));
		
		return $query->run();
	}
	
}
