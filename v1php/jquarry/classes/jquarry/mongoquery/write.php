<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo WRite Query - base class for Mongo queries that write to the database
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mongoquery/write.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Mongoquery_Write extends Jquarry_Mongoquery {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * this class is all about the $set query and stuff
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// this will be overriden by the actual query class
	public function run()
	{
		// get the status of the write and decide what to do
		return $this->write();
	}
	
	// this is where the update actually happens
	abstract protected function write();
	
	// this is passed on the end of the update
	protected function options()
	{
		return array(
			
			// lets commit all writes as they are requested
			"fsync" => true
			
		);	
	}
	
	
}
