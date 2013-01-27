<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Treeencoder - a static class that knows how to make the left and right tree encodings out of a link
 *
 * Each link will decide what type of tree encoding it wants to use
 *
 * So the Mongo Driver will use the nested set tree encoder (i.e. left and right values saved in the meta data)
 *
 * The Filesystem Driver will use the materializes path tree encoder (i.e. based on a path)
 *
 * Decoupling the Tree Encoders and the Storage Drivers seemed like a good idea : )
 * 
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/storage/treeencoder.php
 * @package    	JQuarry
 * @category   	treeencoder
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Storage_Treeencoder {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Singletons
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// singletons
	protected static $_instances = array();
	
	
	
	public function factory($type = 'rationalnestedset')
	{
		$classname = 'Jquarry_Storage_Treeencoder_'.ucfirst($type);
		
		return isset(self::$_instances[$type]) ? self::$_instances[$type] : self::$_instances[$type] = new $classname($type);
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// key used for abstract factory
	protected $type = '';
	
	public function __construct($type)
	{
		$this->type = $type;
	}
	
}
