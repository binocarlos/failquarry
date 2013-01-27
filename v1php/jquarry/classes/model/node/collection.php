<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Database wrapper for the nodes collection - uses PHP mongo ODM
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/mongo/entities.php
 * @package    	JQuarry
 * @category   	Mongo
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Model_Node_Collection extends Mongo_Collection {
	
	protected $name = 'nodes';
	
	/**
	 ********************************************************************************************************************************
	 *
	 * overriden constructor that ensures the installation id is part of the collection name
	 * this prevents one site accessing another sites database
	 *
	  ********************************************************************************************************************************
	*/
	
	public function __construct($name = NULL, $db = 'default', $gridFS = FALSE, $model = FALSE)
	{
		parent::__construct($name, $db, $gridFS, $model);
		
		$installation = Jquarry_Installation::instance();
		
		// this is the ALL IMPORTANT PART!
		$this->name.=$installation->id();
	}
	
}
