<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo Write Update Query - updates an existing node data
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mongoquery/write/update.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Mongoquery_Write_Update extends Jquarry_Mongoquery_Write {
	
	protected $_required_options = array(
	
		// the id to insert into
		"id",
		
		// the data to loop over and give to update
		"data"
	
	);
	
	// this is where the update actually happens
	protected function write()
	{
		$data = $this->options["data"];
		$id = $this->options["id"];
		
		$collection = Mongo_Nodes::instance();
		
		return $collection->update(array(
		
			"_id" => new MongoId($id)
		
		), array(
		
			'$set' => $data
			
		), $this->options());
		
	}
	
	
}
