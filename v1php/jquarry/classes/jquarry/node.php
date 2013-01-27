<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Node - main representation of a tree item
 *
 * this does not hold the actual data
 * all it holds is a storage driver which provies access to the data via get and set
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/node.php
 * @package    	JQuarry
 * @category   	node
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Node {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public static function factory($classpath, $driver, $config = array())
	{
		$classname = Jquarry_Node::classname($classpath);
		
		return new $classname($driver, $config);
	}
	
	// gives you the classname for the given name of node
	// this is now done is the JS
	public static function classname($type)
	{
		return 'Jquarry_Node';
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Tools
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// which fields are we not allowed to mess with via set
	protected static $ignoreupdatefields = array(
		
			"id" => true,
			"_id" => true,
			"_meta" => true,
			"_meta._id" => true,
			"_meta.storage_driver" => true,
			"_meta._storage_driver" => true,
			"_meta.links" => true
			
	);
	
	protected static function can_update_field($name)
	{
		return !isset(self::$ignoreupdatefields[$name]);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// the main storage driver for this node - this provides access to the data and co-ordinates where the thing lives
	// really the storage driver does the main lifting - the node is a nice access to it
	protected $storage_driver;
	
	// a config primitive that is not the realm of the storage driver
	protected $config;
	
	protected $dependent_save_nodes = array();
	
	// a list of dot notated fields that must be present in any node
	protected $ensure_values = array(
	
		"_meta.type" => "node"
		
	);
	
	public function __construct($storage_driver, $config = array())
	{
		$this->storage_driver = $storage_driver;
		
		$this->config = Jquarry_Primitive::factory('config', array_merge($this->_config, $config));
		
		foreach($this->ensure_values as $prop => $val)
		{
			$check = $this->get($prop);
			
			if(empty($check))
			{
				$this->set($prop, $val);
			}	
		}
		
		Jquarry_Registry::instance()->add_node($this);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Tools
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function to_json($asstring = false)
	{
		return $this->storage_driver->to_json($asstring = false);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Query
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// tells you if this node matches a selector query
	public function does_match_selector_query($query)
	{
		
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Access
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function exists()
	{
		return $this->storage_driver->exists();
	}
	
	public function rawdata()
	{
		return $this->storage_driver->rawdata();
	}
	
	public function setmeta($field, $value = null)
	{
		return $this->storage_driver->setmeta($field, $value);
	}
	
	public function meta($field, $value = null)
	{
		if(!empty($value))
		{
			throw new Kohana_Exception("Node Meta should not be used to set a value");
		}
		
		return $this->getmeta($field);
	}
	
	public function getmeta($field, $value = null)
	{
		return $this->storage_driver->getmeta($field);
	}
	
	public function get($field)
	{
		return $this->storage_driver->get($field);
	}
	
	public function set($field, $value = null)
	{
		if(Jquarry_Node::can_update_field($field))
		{
			
			return $this->storage_driver->set($field, $value);
		}
		else
		{
			return $value;
		}
	}
	
	// return the database id
	public function id()
	{
		return $this->storage_driver->id();
	}
	
	// return the jquarry selector id
	public function selector_id($value = null)
	{
		if($value!==null)
		{
			return $this->setmeta('selector_id', $value);
		}
		else
		{
			return $this->getmeta('selector_id');
		}
	}
	
	// return the jquarry type
	public function type($value = null)
	{
		if($value!==null)
		{
			return $this->setmeta('type', $value);
		}
		else
		{
			return $this->getmeta('type');
		}
	}
	
	// return the jquarry classnames
	public function classnames($value = null)
	{
		if($value!==null)
		{
			return $this->setmeta('classnames', $value);
		}
		else
		{
			return $this->getmeta('classnames');
		}
	}
	
	// return the jquarry blueprint name
	public function blueprintname()
	{
		return $this->storage_driver->blueprintname();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Storage
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// gets this node saved into the storage driver
	public function save()
	{
		$this->storage_driver->save();
		
		/*
		// tell the registry that the parent needs saving if we save the child
		$registry = Jquarry_Registry::instance();
		
		$registry->trigger_dependant_save_nodes($this);
		*/
		
		foreach($this->dependent_save_nodes as $dependent_id => $node)
		{
			$node->save();		
		}
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Links
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// returns an array of this nodes links via the driver
	// one node can have several links because it can be ghosted somewhere
	// this means it will have 2 or more links in the _meta.links field (for mongo anyway)
	public function links()
	{
		return $this->storage_driver->links();
	}
	
	// this is where we want the driver to create a link to a parent link
	public function create_link($parent_link = null)
	{
		$this->storage_driver->create_link($parent_link);
	}
	
	public function add_dependant_save_node($dependent_node)
	{
		$this->dependent_save_nodes[$dependent_node->id()] = $dependent_node;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Links
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// this wants to return an array with a type (nestedset, materilized path) and the encoding values
	//
	public function tree_query($splitter)
	{
		return $this->storage_driver->tree_query($splitter);
	}
	
	// returns the number of children that are linked to this node
	public function child_count($modify = null)
	{
		if(!empty($modify))
		{
			$existing = $this->getmeta('child_count');
			
			$new = $existing + $modify;
			
			$this->setmeta('child_count', $new);
		}
		
		return $this->getmeta('child_count');
	}
	
}
