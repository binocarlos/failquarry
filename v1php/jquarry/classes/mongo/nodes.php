<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Database wrapper for the nodes collection within mongodb (installation specific)
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
class Mongo_Nodes extends Mongo_Collection {
	
	protected $collection_name = 'nodes';
		
}
