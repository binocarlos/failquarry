<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo Write Insert Query - inserts a new node
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mongoquery/write/insert.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Mongoquery_Write_Insert extends Jquarry_Mongoquery_Write {
	
	protected $_required_options = array(
	
		// the data to insert as a new node
		"data"
	
	);
	
	// this is where the update actually happens
	protected function write()
	{
		$data = $this->options["data"];
		
		$collection = Mongo_Nodes::instance();
		
		return $collection->insert($data, $this->options());
	}
	
	
}
