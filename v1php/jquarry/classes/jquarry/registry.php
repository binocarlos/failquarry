<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Registry class for keeping track of it all
 *
 * Singleton
 *
 * the registry is what holds a reference to all nodes that have been loaded
 *
 * it is duplicated in PHP and JavaScript (client & server)
 *
 * rather than clutter the node class with loads of tree stuff - we want the tree class to look after that and the registry is it's data source
 * also - rather than fill up the nodes themselves with the objects that are their children - we want to maintain a map of what belongs to what
 * then - when you ask for node.children() - it will ask the registry for the nodes it has that are children to the node
 *
 * the registry will deal with tree encodings and selectors eventually (so you can run selectors against in memory trees)
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/registry.php
 * @package    	JQuarry
 * @category   	registry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Registry {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 * the registry can be used as a global singleton and as a one-off instance (this is useful to trees that want to work 
	 * with a sub-set of data)
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// singleton
	protected static $instance;
	
	public static function instance()
	{
		return isset(Jquarry_Registry::$instance) ? 
			Jquarry_Registry::$instance : 
			Jquarry_Registry::$instance = new Jquarry_Registry();
	}
	
	public static function factory()
	{
		return new Jquarry_Registry();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	
	// nodes by id
	protected $nodes = array();
	
	// a map of registry entries for each node by id
	protected $entries = array();
	
	// component singletons - uses for efficiency
	protected $components = array();
	
	protected function __construct()
	{
		
	}
	
	public function add_node($node)
	{
		$this->nodes[$node->id()] = $node;
		
		$entry = $this->ensure_registry_entry($node);
		
	}
	
	protected function get_registry_entry($node_id)
	{
		return $this->entries[$node_id];
	}
	
	// gives you a general holding array for a node
	// this will contain fields for each of the link's fields property found
	protected function ensure_registry_entry($node)
	{
		if(isset($this->entries[$node->id()])) { return $this->entries[$node->id()]; }
		
		return $this->entires[$node->id()] = Jquarry_Registryentry::factory($node);
	}
	
	public function get_node($id)
	{
		$entry = $this->get_registry_entry($id);
		
		return $entry==null ? null : $entry->node();
	}
	
	public function get_node_children($depth = 0)
	{
		
	}
	
	public function component($component_type, $component_name)
	{
		
	}
	
	
}
