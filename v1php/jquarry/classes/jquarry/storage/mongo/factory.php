<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo Factory - turns jquarry queries into mongo data
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/storage/mongo_factory.php
 * @package    	JQuarry
 * @category   	storage factory
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Storage_Mongo_Factory extends Jquarry_Storage_Factory {
	
	// key used for abstract factory
	protected $type = 'mongo';
	
	
	
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
