<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Save Action - takes some node data and saves it
 *
 * the save action can be any of:
 *
 * save - the abstract base class
 * insert - new node
 * update - existing node
 *
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/action/save.php
 * @package    	JQuarry
 * @category   	save
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Action_Save extends Jquarry_Action {
	
	// this is called to commit the data to the db
	protected function doaction()
	{
		// ensure a list of node data
		if(!is_array($this->data))
		{
			$this->data = array($this->data);
		}
		
		// look at each save instruction we have
		foreach($this->data as $instruction)
		{
			// get the changed node data
			$nodedata = $instruction->data;
			
			// and the config containing all the ids
			$config = $instruction->config;

			// the id of the node for the save action
			$id = $config->node_id;
			
			// if it is an append to the the id of the parent node
			$parent_id = $config->parent_id;
			
			// the storage driver we are auto-booting for the operation (sent from the client node)
			$driver = $config->storage_driver;
			
			$node = null;
			
			$commit = false;
			
			// are we an insert action
			if($this->name=='insert')
			{
				// create a new node based on the data
				$node = Jquarry_Query::constructorfactory($nodedata, array(
			
					"storage_driver" => $driver
					
				));
				
				// we want to save
				$commit = true;
			}
			// no we have an existing node to update
			else if($this->name=='update')
			{
				// load the node using the id
				$node = Jquarry_Query::idfactory($id, array(
			
					"storage_driver" => $driver
					
				));
				
				// loop through the changed values and set the node with them		
				foreach($nodedata as $prop => $val)
				{
					// we have found a changed value - we want to save
					$commit = true;
					
					$node->set($prop, $val);
				}
			}
			
			if(!$node || !$commit) { continue; }
			
			$parent_node = Jquarry_Query::idfactory($parent_id, array(
			
				"storage_driver" => $driver
				
			));
			
			// if there is no parent_node then this will be added at the top of the tree
			Jquarry_Tree::add_child($node, $parent_node);
			
			$node->save();
		}
		
		return true;
	}
	
}
