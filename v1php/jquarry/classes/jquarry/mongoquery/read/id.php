<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo Read Selector Stage Query - mongo query for getting data for a selector stage
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mongoquery/read/selectorstage.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Mongoquery_Read_Id extends Jquarry_Mongoquery_Read {
	
	protected $_required_options = array(
	
		"id"
	
	);
	
	// gets the clause for the read query
	protected function query()
	{
		$id = $this->options["id"];
		
		$mainquery = array(
		
			"_id" => new MongoId($id)
			
		);

		return $mainquery;
	}
	
}
