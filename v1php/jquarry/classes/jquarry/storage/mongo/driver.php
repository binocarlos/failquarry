<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Drvier - base class and factory for drivers
 *
 * The mongo factory provides the driver with a Model_Node object as it's data
 * (this overrides the PHP Mongo ODM Document class)
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/storage/mongo/driver.php
 * @package    	JQuarry
 * @category   	driver
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Storage_Mongo_Driver extends Jquarry_Storage_Driver {
	
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Property functions
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// once off init
	protected function process_data()
	{
		// this converts arrays to an object
		$this->data = Jquarry_Primitive::factory('node', $this->data);
		
		// this turns the mongo id object into a flat id
		$id = $this->data->get("_id");
		
		if(is_object($id))
		{
			$prop = '$id';
		
			$this->data->set("_id", $id->$prop, true);
		}
	}
	
	// gives you a mongo id for this object
	protected function mongoid()
	{
		return new MongoId($this->id());
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Set - controls how the data is written into the Mongo_Document object (which is based on an array)
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function set($field, $value = null)
	{
		$this->set_changed($field);
		
		// check if we should be doing this
		if(Kohana::$config->load('jquarry.mongo.auto_convert_datatypes'))
		{
			$excludes = Kohana::$config->load('jquarry.mongo.dont_auto_convert_node_fields');
			
			if(!$excludes[$field])
			{
				$value = Tools_Php::auto_convert($value);
			}
		}
		
		
		return $this->data->set($field, $value);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * This is important because it is how the node is communicated into JS
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function to_json($as_string = false)
	{
		$data = $this->rawdata();
		
		if($as_string)
		{
			$data = JSON::str($data);
		}
		
		return $data;
	}
	
	// this is the reverse of the above
	public function from_json($data)
	{
		return $data;
	}
	
	public function rawdata()
	{
		return $this->data->data();
	}
	
	public function defaultmeta($field, $default = null)
	{
		$ret = $this->meta($field);
		
		return empty($ret) ? $default : $ret;
	}
	
	public function getmeta($field, $value = null)
	{
		$field = "_meta.".$field;
		
		return $this->get($field);
	}
	
	public function setmeta($field, $value = null)
	{
		$field = "_meta.".$field;
		
		return $this->set($field, $value);		
	}
	
	public function get($field)
	{
		return $this->data->get($field);
	}

	// return the database id
	public function id()
	{
		return ''.$this->get('_id');
	}
	
	// return the jquarry blueprint name
	public function blueprintname()
	{
		$blueprint = $this->meta('blueprint');
		
		if(empty($blueprint))
		{
			$blueprint = $this->meta('type');
		}
		
		return $blueprint;
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Storage
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function exists()
	{
		$id = $this->id();
		
		return !empty($id);
	}
	
	public function save()
	{
		if(!$this->haslinks())
		{
			throw new Kohana_Exception("A Node must have links to be able to save -> {$this->id()}");	
		}
		
		$query = null;
		
		// it is an update
		if($this->exists())
		{
			$query = Jquarry_Mongoquery::factory('update', array(
		
				'id' => $this->id(),
				
				'data' => $this->get_changed_values()
			
			));
		}
		// it is an insert
		else
		{
			$query = Jquarry_Mongoquery::factory('insert', array(
		
				'data' => $this->get_changed_values()
			
			));
		}
		
		$status = $query->run();
		
		if(!$status["ok"])
		{
			throw new Kohana_Exception("Node Save had a mongo error: ".$status["errmsg"]);	
		}
		
		return true;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * links
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// create Mongo Link objects from the nodes _meta data
	protected function build_links()
	{
		$linkdata = $this->defaultmeta('links', array());
		
		$links = array();
		
		foreach($linkdata as $linkdata)
		{
			$links[] = $this->build_link($linkdata);
		}
		
		return $links;
	}
	
	protected function first_link()
	{
		$links = $this->build_links();
		
		return $links[0];	
	}
	
	protected function build_link($linkdata)
	{
		$link = Jquarry_Storage_Link::factory('mongo', $linkdata);
		
		$link->node_id($this->id());
		
		return $link;
	}
	
	protected function insert_link_data(Jquarry_Storage_Link $link)
	{
		$linkdata = $this->defaultmeta('links', array());
		
		$linkdata[] = $link->data();
		
		$this->setmeta('links', $linkdata);
	}
	
	public function tree_query($splitter)
	{
		$ors = array();
		
		if($splitter->up())
		{
			$links = $this->build_links();
			
			if($splitter->direct())
			{
				foreach($links as $link)
				{
					$ors[] = array(
					
						"_id" => new MongoId($link->get('parent_node_id'))
					
					);	
				}
			}
			else
			{
				foreach($links as $link)
				{
					$ors[] = array(
					
						'$and' => array(
					
							"_meta.links.left" => array(
					
								'$lt' => $link->get('left')
								
							),
							
							"_meta.links.right" => array(
					
								'$gt' => $link->get('right')
								
							)
						)
					);
				}
			}
		}
		else if($splitter->down())
		{
			$link = $this->first_link();
			
			if($splitter->direct())
			{
				$ors[] = array(
					
					"_meta.links.parent_node_id" => $this->id()
				
				);	
				
			}
			else
			{
				
				
				$ors[] = array(
				
					'$and' => array(
					
						array(
					
							"_meta.links.left" => array(
				
								'$gt' => $link->get('left')
							
							)
							
						),
						
						array(
						
							"_meta.links.right" => array(
				
								'$lt' => $link->get('right')
								
							)
							
						)
					)
					
				);
				
			}
		}
		
		return $ors;
	}
	

	
}
