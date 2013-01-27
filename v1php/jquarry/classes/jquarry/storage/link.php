<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Link - a link represents a node at some point in the tree
 * 
 * each node can have several links pointing to different parents - this is how a node is ghosted
 *
 * each link has at least (the things the whole tree can be built from again):
 *
 *	parent_id - used to get the parent from the registry
 *	field - what field in the parent is this destined for
 *  order - what order in the parent
 *  depth - the depth this link lives at
 *
 *  tree encodings - a tree encoding object created by the driver
 * 
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
abstract class Jquarry_Storage_Link {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function factory($type = 'mongo', $linkdata = null)
	{
		$classname = 'Jquarry_Storage_'.ucfirst($type).'_Link';
		
		return new $classname($linkdata);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// the data is a pointer into the nodes data
	protected $data;
	
	// this is passed in via the driver - we don't want to hold the node id in the actual data
	// because that would be copying it from the level just above - we still need to have it from link level
	// otherwise we would have to mess around passing the driver through etc
	protected $node_id;
	
	// these are the defaults for a link
	protected $_defaults = array(
	
		'type' => 'tree'
		
	);
	
	public function __construct($data)
	{
		// lets make sure we have a primitive object as the link data
		$this->data = Jquarry_Primitive::factory('object', $data);
		
		$_defaults = array(
		
			'type' => Kohana::$config->load('jquarry.tree.default_link_type'),
			
			'field' => Kohana::$config->load('jquarry.tree.default_child_field')
		
		);
		
		foreach($_defaults as $field => $value)
		{
			$existing = $this->get($field);
			
			if($existing==null)
			{
				$this->data->set($field, $value, true);
			}
		}
		
		$this->ensure_id();
	}
	
	public function has_changed()
	{
		return $this->data->has_changed();
	}
	
	public function set($field, $value = null)
	{
		return $this->data->set($field, $value);
	}
	
	public function get($field)
	{
		return $this->data->get($field);
	}
	
	public function id($newvalue = null)
	{
		return $this->data('id', $newvalue);	
	}
	
	// what type is the link ('tree' or 'field')
	public function type($newvalue = null)
	{
		if($newvalue!==null)
		{
			$types = Kohana::$config->load('jquarry.tree.link_types');
		
			if(!$types[$newvalue])
			{
				throw new Kohana_Exception("{$newvalue} is not a support link type");
			}
		}
			
		$ret = $this->data('field', $newvalue);
		
		return empty($ret) ? Kohana::$config->load('jquarry.tree.default_link_type') : $ret;
	}
	
	// what field is this link for (default 'children')
	public function field($newvalue = null)
	{
		$ret = $this->data('field', $newvalue);
		
		return empty($ret) ? Kohana::$config->load('jquarry.tree.default_child_field') : $ret;
	}
	
	public function left($newvalue = null)
	{
		return $this->data('left', $newvalue);	
	}
	
	public function right($newvalue = null)
	{
		return $this->data('right', $newvalue);	
	}
	
	public function position($newvalue = null)
	{
		return $this->data('position', $newvalue);	
	}
	
	public function position_path($newvalue = null)
	{
		return $this->data('position_path', $newvalue);	
	}
	
	public function depth($newvalue = null)
	{
		return $this->data('depth', $newvalue);	
	}
	
	public function parent_node_id($newvalue = null)
	{
		return $this->data('parent_node_id', $newvalue);	
	}
	
	public function parent_link_id($newvalue = null)
	{
		return $this->data('parent_link_id', $newvalue);	
	}
	
	public function node_id($newvalue = null)
	{
		if($newvalue!==null)
		{
			$this->node_id = $newvalue;
		}
		
		return $this->node_id;
	}
	
	// makes sure this link has got an id
	protected function ensure_id()
	{
		$existing = $this->id();
		
		if(empty($existing))
		{
			$this->id(Tools_Storage::id());
		}
		
		return $this->id();
	}
	
	public function data($field, $newvalue = null)
	{
		return $this->data->data($field, $newvalue);
	}
	
	// gives you access to the node from this link (uses the registry)
	public function node()
	{
		$registry = Jquarry_Registry::instance();
		
		return $registry->get_node($this->node_id());
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Abstracts
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// construct a tree encoder this link will use
	abstract public function tree_encoder();
	
	// tells you if this link to pointing to the given parent node
	abstract public function is_for_parent_node(Jquarry_Node $parent);
	
	// sets this link up to point to another link
	abstract public function link_to_parent_link($parent_link = null);
	
}
