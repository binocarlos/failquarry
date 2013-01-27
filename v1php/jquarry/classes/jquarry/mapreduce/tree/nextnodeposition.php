<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry MapReduce Nextnodeposition - tells you the next position available for the root node
 *
 * i.e. if there are 4 things at the top then this will return 5
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mapreduce/tree/nextrootposition.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Mapreduce_Tree_Nextnodeposition extends Jquarry_Mapreduce {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Results
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// get the value from the first element - this will be the hightest position
	// for root nodes
	protected function process_results($result_array)
	{
		$first = $result_array[0];
		
		$ret = 1;
		
		if(!empty($first))
		{
			$ret = $first["value"] + 1;
		}
		
		return $ret;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Query
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function query()
	{
		$parent_id = !empty($this->options["node_id"]) ? $this->options["node_id"] : 0;
		
		$query=<<<EOT
{
	"_meta.links.parent_node_id":"{$parent_id}"
}
EOT;

		return $query;
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Map
	 *
	 *
	 ********************************************************************************************************************************
	*/
	protected function map()
	{
		$map=<<<EOT
function() {
    emit('position', this._meta.links[0].position);
}
EOT;

		return $map;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Reduce
	 *
	 *
	 ********************************************************************************************************************************
	*/
	protected function reduce()
	{
		$reduce=<<<EOT
function(key, values) {
    var max = values[0];
    values.forEach(function(val){
        if (val > max) max = val;
    })
    
    return max;
}
EOT;

		return $reduce;
	}
	
	
	
}
