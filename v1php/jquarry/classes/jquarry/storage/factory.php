<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Factory - base class for storage factories
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/storage/factory.php
 * @package    	JQuarry
 * @category   	storage factory
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Storage_Factory {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Singletons
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// singletons
	protected static $_instances = array();
	
	// key used for abstract factory
	protected $type = '';
	
	public function factory($type = 'mongo')
	{
		$classname = 'Jquarry_Storage_'.ucfirst($type).'_Factory';
		
		return isset(self::$_instances[$type]) ? self::$_instances[$type] : self::$_instances[$type] = new $classname();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function __construct()
	{
		
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * constructor query - this makes new nodes
	 * this will return a single node rather than a node collection
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function run_constructor_query(Jquarry_Query_Constructor $query)
	{
		if(empty($query))
		{
			throw new Exception("Query must be defined to call run in storage factory");
		}
		
		$rawdata = $this->constructor_query_data($query);
		
		return $this->build_collection($rawdata, $query);
	}
	
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
		
		$rawdata = $this->id_query_data($query);
		
		return $this->build_collection($rawdata, $query);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * json query - re-creates nodes from a JSON string
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function run_json_query(Jquarry_Query_Json $query)
	{
		if(empty($query))
		{
			throw new Exception("Query must be defined to call run in storage factory");
		}
		
		$rawdata = $this->json_query_data($query);
		
		return $this->build_collection($rawdata, $query);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * selector loop
	 *
	 * each selector comes in phases e.g. #products .onsale, #images .big is 2 phases
	 * the end results of each phase are merges into one nodecollection
	 *
	 * each phase comes in stages e.g. #products .onsale is 2 stages
	 * each stage produces a nodecollection which is used for the clause of the next stage
	 *
	 * the first link from the stage nodes is used for the next stage 
	 * (multiple links i.e. ghosts are equivalent for children selectors - it is the parents that are different)
	 *
	 * once the final stage has returned - the links are analyzed by the specific factory to see which link to use for the id)
	 *
	 * up until the final stage - we will only load a skeleton objects at a single depth 
	 * (because we only want the tree encodings for the next stage)
	 *
	 * then for the final stage - a query needs to have control over how many depths to include for the returned data
	 *
	 *
	  ********************************************************************************************************************************
	*/
	
	public function run_selector_query(Jquarry_Query_Selector $query)
	{
		if(empty($query))
		{
			throw new Exception("Query must be defined to call run selector in storage factory");
		}
		
		// the collection that will contain the merged phases
		$final_node_collection = $this->build_collection();
		
		$skeleton = $query->get_context_skeleton();
		
		// this is the base colletion to start the query from - this is given as the context to $quarry
		//
		// e.g. $quarry('folder', withinFolder).run(
		//
		// would look for folders decendant to withinFolder
		
		$skeleton_collection = null;
		$skeleton_splitter = null;
		
		if(!empty($skeleton))
		{
			// make a collection out of the JSON string (gives 
			$skeleton_collection = Jquarry_Query::factory($skeleton)->run();
			$skeleton_splitter = $query->default_splitter();
		}
		
		// each phase is an array of stage selector stage objects
		// the results will be merged into the final collection
		foreach($query->phases() as $phasearray)
		{
			$current_node_collection = $skeleton_collection;
			$current_stage_splitter = $skeleton_splitter;
			
			$last_selector_stage = array_pop($phasearray);
			
			foreach($phasearray as $selector_stage)
			{
				if($selector_stage->is_splitter())
				{
					$current_stage_splitter = $selector_stage;
					
					continue;
				}
				
				$stage_raw_data = $this->selector_stage_data(array(
				
					'skeleton' => true,
					
					'selector_stage' => $selector_stage,
					
					'previous_collection' => $current_node_collection,
					
					'splitter' => $current_stage_splitter
					
				));
				
				$current_node_collection = $this->build_collection($stage_raw_data, $query);
			}
			
			$last_stage_raw_data = $this->selector_stage_data(array(
				
				'skeleton' => false,
				
				'selector_stage' => $last_selector_stage,
				
				'previous_collection' => $current_node_collection,
				
				'splitter' => $current_stage_splitter
					
			));
			
			$phase_node_collection = $this->build_collection($last_stage_raw_data, $query);
			
			$final_node_collection->append($phase_node_collection);
		}
		
		return $final_node_collection;
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * packages up the raw node data neatly into a nodecollection ready to return to the caller of the factory
	 *
	 *
	  ********************************************************************************************************************************
	*/
	
	// an array of raw node data in and a nodecollection out
	public function build_collection($raw_nodes = array(), $query)
	{
		if(!is_array($raw_nodes))
		{
			$raw_nodes = array($raw_nodes);
		}
		
		$nodes = array();
		
		foreach($raw_nodes as $raw_node)
		{
			$nodes[] = $this->node_factory($raw_node, $query);
		}
		
		return Jquarry_Nodecollection::factory($nodes);
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * turn raw objects into nice nodes
	 *
	 *
	  ********************************************************************************************************************************
	*/
	protected function node_factory($nodedata, $query)
	{
		// if we already have a node then return it
		if(is_a($nodedata, 'Jquarry_Node'))
		{
			return $nodedata;
		}
		
		// make the driver first because it will know how to dig into the data
		// and get the blueprint info
		$driver = $this->driver_factory($nodedata, $query);
		
		// now we can get the blueprint
		$blueprint = $driver->blueprint();
		
		// and with which create the node
		$node = Jquarry_Node::factory($blueprint->node_classname(), $driver);
		
		return $node;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * create the storage driver out of the raw data
	 *
	 * it is passed the originating query so the driver can decide whether the node exists or not
	 *
	 *
	  ********************************************************************************************************************************
	*/
	
	public function driver_factory($nodedata, $query)
	{
		$driver = Jquarry_Storage_Driver::factory($this->type, $nodedata);
		
		return $driver;
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * constructor
	 *
	 * this is where the factory implementation must return data for a constructor query
	 *
	  ********************************************************************************************************************************
	*/
	
	// this should return raw objects because it is the equivalent of a database call
	protected function constructor_query_data($query)
	{
		$data_arr = $query->config('data');
		
		$rawnode = $data_arr[0];
		
		if(!$rawnode)
		{ 
			$rawnode = array(
			
				"_meta" => array(
				
					"type" => "node"
					
				)
			
			);
		}
		
		return $rawnode;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * JSON
	 *
	 * this is where the factory implementation must return data for a json query
	 *
	 *
	  ********************************************************************************************************************************
	*/
	
	// grabs the json array as the data
	protected function json_query_data($query)
	{
		$data = $query->config("data");
		
		return $data;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * this is where the factory implementation must return data for an id query
	 *
	 *
	  ********************************************************************************************************************************
	*/
	abstract protected function id_query_data($query);
	
	/**
	 ********************************************************************************************************************************
	 *
	 * this is where the factory implementation must return data for a selector query
	 *
	 *
	  ********************************************************************************************************************************
	*/
	abstract protected function selector_stage_data($config = array());
}
