<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Tree class for containing all of the tree related logic in one place
 *
 * It is a singleton and works with nodes passed to it - lets not clutter than node hey : )
 *
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/tree.php
 * @package    	JQuarry
 * @category   	tree
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Tree {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Singleton
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// singleton
	protected static $instance;
	
	public static function instance()
	{
		return isset(self::$instance) ? 
			self::$instance : 
			self::$instance = new Jquarry_Tree();
	}
	
	public static function factory()
	{
		return new Jquarry_Tree();
	}
	
	
	/**
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 *
	 * Static Library - these functions don't represent a data structure within a tree (like an instatiated tree object does)
	 * rather they provide linking functions that can be run statically
	 *
	 *
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	*/
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Config
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// tells you the field name to link to children on
	public static function child_field_name($field = null)
	{
		return $field!==null ? $field : Kohana::$config->load('jquarry.tree.default_child_field');
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Tree Tools
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// adds one child to another
	// if there is no parent it means add this to the top
	
	public static function add_child($child, $parent = null, $field = null)
	{
		$field = self::child_field_name($field);
		
		if($parent)
		{
			return self::add_child_to_parent($child, $parent, $field);
		}
		else
		{
			return self::add_child_to_root($child, $field);
		}
	}
	
	public static function add_child_to_parent($child, $parent, $field)
	{
		// is the parent already linked to the child?
		if(self::child_has_parent($child, $parent)) { return; }
	
		foreach($parent->links() as $parentlink)
		{
			$child->create_link($parentlink);	
		}
		
		$parent->child_count(1);
		
		$child->add_dependant_save_node($parent);
		
		/*
		// tell the registry that the parent needs saving if we save the child
		$registry = Jquarry_Registry::instance();
		
		$registry->add_dependant_save_node($child, $parent);
		*/
	}
	
	public static function add_child_to_root($child, $field)
	{
		// is the parent already linked to the child?
		if(self::child_has_parent($child)) { return; }

		$child->create_link();
	}
	
	// have a look at the child links to see if there is one for the parent
	// if the parent_id is 0 it means the root
	public static function child_has_parent($child, $parent)
	{
		foreach($child->links() as $link)
		{
			if($link->is_for_parent_node($parent)) { return true; }
		}
		
		return false;
	}
	
	/**
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 *
	 * Instance - this is the data structure that represents a collection of nodes in a tree structure
	 *
	 *
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	 ********************************************************************************************************************************
	*/
	
	// the standalone (not global) registry for this tree
	protected $registry;
	
	protected function __construct()
	{
		$this->registry = Jquarry_Registry::factory();
	}
	
	
	
	
	
	
	
}
