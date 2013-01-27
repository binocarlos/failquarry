<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo Link - a link in the mongo world
 * 
 * this works with positions (as it's using the rationalnestedset encoder)
 *
 * each link holds a 'position' field (what position is this node to it's parent)
 * also it holds a 'next_child_position' field (what position the next inserted child is at in this node)
 * finally it holds a 'position_path' field - basically it's position appended onto the parent.position_path
 *
 * the next_child_position keeps incrementing - even if a node is deleted is doesn't matter to the encoder
 * all the encoder wants to know is 'what is the next position' rather than worry about missing positions
 *
 * evey time you add a child to a parent link - the child is in the parent.next_child_position + 1 position
 * when you do this - the parents next_child_position needs incrementing so this is a classic dependent save operation (registry)
 *
 * you then use the parent.position_path + ':' this.position to get the path that is used for the tree encodings
 * 
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/storage/mongo/link.php
 * @package    	storage
 * @category   	mongo
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Storage_Mongo_Link extends Jquarry_Storage_Link {
	
	public function __construct($data)
	{
		parent::__construct($data);
		
		
	}
	
	// rationalnested set for mongo
	public function tree_encoder()
	{
		return Jquarry_Storage_Treeencoder::factory('rationalnestedset');
	}
	
	public function is_for_parent_node(Jquarry_Node $parent = null)
	{
		// if this is true then we are asking if we have a root link
		if($parent==null)
		{
			return $this->data('parent_node_id')==null || $this->data('parent_node_id')==0;
		}
		// no are asking for a particular parent
		else
		{
			return $parent->id() == $this->data('parent_node_id');	
		}
	}
	
	// NOTE - this assumes that this is a new link
	// need to work out how to hell this is gonna work recursive style
	public function link_to_parent_link($parent_link = null)
	{
		$this->parent_node_id($parent_link !== null ? $parent_link->node_id() : "0");
		$this->parent_link_id($parent_link !== null ? $parent_link->id() : "0");
		
		// we are linking to the very top
		if($parent_link===null)
		{
			// get the next slot in the root of the tree
			$next_root_position = $this->get_next_root_position();
			
			$this->depth(1);
			
			$this->position($next_root_position);
			$this->position_path(array($next_root_position));
		}
		else
		{
			// grab the next position slot for this child link
			$next_parent_position = $this->get_next_parent_position($parent_link);
			
			$node_position_path = $parent_link->position_path();
			
			$node_position_path[] = $next_parent_position;
			
			$this->depth($parent_link->depth() + 1);
			$this->position($next_parent_position);
			$this->position_path($node_position_path);
			
		}
		
		$encoder = $this->tree_encoder();
		
		$encodings = $encoder->calculate_encodings_from_position($this->position_path());
		
		$this->left("{$encodings['leftencoding']}");
		$this->right("{$encodings['rightencoding']}");
	}
	
	// asks the database for the highest root link position and adds 1
	// this does a map/reduce to get the maximum
	protected function get_next_root_position()
	{
		$mapreduce = Jquarry_Mapreduce::factory('nextnodeposition');
		
		return (int) $mapreduce->run();
	}
	
	protected function get_next_parent_position($parent_link)
	{
		$mapreduce = Jquarry_Mapreduce::factory('nextnodeposition', array(
		
			'node_id' => $parent_link!=null ? $parent_link->node_id() : null
		
		));
		
		return (int) $mapreduce->run();
	}
}
