<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Storage Drvier - base class and factory for storage drivers
 * a storage driver is the object (one per node) responsible for saving stage for a node
 * it is aware ONLY of a single node - not the context the node lives in the tree (that is the job of the factory)
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/storage/driver.php
 * @package    	JQuarry
 * @category   	driver
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Storage_Driver {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function factory($type = 'mongo', $nodedata = null)
	{
		$classname = 'Jquarry_Storage_'.ucfirst($type).'_Driver';
		
		return new $classname($nodedata);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// the data the storage drivers needs to work with
	protected $data = null;
	
	// an array of the links this storage driver is managing
	// if null then we have not processed the link objects from the raw data yet
	// if blank array then there are no links
	protected $links = null;

	// a reference to the singleton blueprint for this node
	protected $blueprint = null;
	
	// keep track of any modified fields
	protected $_changed = array();
	
	protected function __construct($data)
	{
		// this is the raw data that the storage driver generated
		// how each driver deals with it is up to it
		$this->data = $data;
		
		// turn the data into what we want it to be
		$this->process_data();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Blueprint - resolve what blueprint to return for this node
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function blueprint()
	{
		if($this->blueprint) { return $this->blueprint; }
		
		// do we have a fullpath to the blueprint file used to create this node
		$blueprintquery = $this->blueprintname();
		
		// no - so we will assume the default blueprints and use the node type instead
		if(empty($blueprintquery))
		{
			$blueprintquery = $this->meta('type');
		}
		
		return $this->blueprint = Jquarry_Component::blueprintfactory($blueprintquery);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Property updating
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// flag a field as updated
	protected function set_changed($field)
	{
		$this->_changed[$field] = true;
	}
	
	protected function reset_changed()
	{
		$this->_changed = array();
	}
	
	public function get_changed_values()
	{
		if(!$this->exists()) { return $this->rawdata(); }
		
		$ret = array();
		
		foreach($this->_changed as $field => $val)
		{
			$ret[$field] = $this->get($field);
		}
		
		return $ret;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Abstract property functions
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	abstract protected function process_data();
	
	abstract public function to_json($as_string = false);
	
	// return the raw data (stdClass)
	abstract public function rawdata();
	
	public function meta($name)
	{
		return $this->getmeta($name);
	}
	
	abstract public function setmeta($name, $value = null);
	
	abstract public function getmeta($name);
	
	abstract public function get($name);
	
	abstract public function set($name, $value = null);
	
	// return the database id
	abstract public function id();
	
	// return the jquarry blueprint name
	abstract public function blueprintname();
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Abstract Storage functions
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	abstract public function exists();
	
	abstract public function save();
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Abstract Link functions
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	abstract public function tree_query($splitter);
	abstract protected function build_links();
	abstract protected function build_link($linkdata);
	abstract protected function insert_link_data(Jquarry_Storage_Link $link);
	
	// the first link - can be used for children because each ghost is a child tree copy
	public function firstlink()
	{
		$links = $this->links();
		
		return $links[0];
	}
	
	public function countlinks()
	{
		$links = $this->links();
		
		if(empty($links)) { return 0; }
		
		return count($links);	
	}
	
	public function haslinks()
	{
		return $this->countlinks()>0;
	}
	
	public function links()
	{
		if($this->links!=null) { return $this->links; }
				
		$this->links = $this->build_links();

		if(empty($this->links)) { $this->links = array(); }
		
		return $this->links;
	}
	
	// a new link has been created so lets add it to the links array and also insert it's data into the meta data
	public function add_link(Jquarry_Storage_Link $link)
	{
		$existing_links = $this->links();
		
		$this->links[] = $link;
		
		$this->insert_link_data($link);
	}
	
	// creates a link pointing to another
	public function create_link($parent_link = null)
	{
		$newlink = $this->build_link();
		
		$newlink->link_to_parent_link($parent_link);
		
		$this->add_link($newlink);
	}
	

}
