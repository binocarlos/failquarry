<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo Read Query - base class for Mongo queries that read from the database
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mongoquery/read.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Mongoquery_Read extends Jquarry_Mongoquery {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * this class is all about doing a 'find' command on the collection with 
	 * the query given in the options - it reads one or more nodes from the cursor and returns the data
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// do we want an array of data or the first one
	protected $singular = false;
	
	// this will be overriden by the actual query class
	public function run()
	{
		$query = $this->query();
		
		$fields = $this->fields();
		
		if(empty($fields)) { $fields = array(); }
		
		$collection = Mongo_Nodes::instance();
		
		return $this->process_results($collection->query($query, $fields));
	}
	
	// a change to manipulate what is returned by the query
	protected function process_results($result_array)
	{
		if($this->singular)
		{
			return $result_array[0];
		}
		
		return $result_array;
	}
	
	// gets the clause for the read query
	abstract protected function query();
	
	// gets the fields to return for this read query
	protected function fields()
	{
		return array();
	}
	
	
	
	
}
