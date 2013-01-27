<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry MapReduce - base class for Mongo map reduce queries
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mapreduce.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Mapreduce {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// a map of component type onto the class they should use
	// most will use directorybased
	protected static $classmap = array(
	
		'nextnodeposition' => 'tree.nextnodeposition'
		
	);
	
	// return a new pointer
	public static function factory($name, $query = null, $collection = null)
	{
		$classname = self::classname($name);
		
		if(!class_exists($classname))
		{
			throw new Kohana_Exception("No mapreduce with classname {$classname}");
		}
		
		$mapreduce = new $classname($query, $collection);
		
		return $mapreduce;
	}
	
	
	protected static function classname($name)
	{
		$name = !empty(self::$classmap[$name]) ? self::$classmap[$name] : $name;
		
		$parts = explode('.', $name);
		
		$finalparts = array('Jquarry', 'Mapreduce');
		
		foreach($parts as $part)
		{
			$finalparts[] = ucfirst($part);
		}
		
		$classname = implode('_', $finalparts);
		
		return $classname;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// the values passed to the mapreduce
	// it is the job of the overidden mapreduce class to turn this into a mongo query
	// to run documents through the 2 functions
	protected $options = null;
	
	// the Mongo_Collection that we want to apply the mapreduce to
	protected $collection = null;
	
	protected function __construct($options = null, $collection = null)
	{
		// default to blank options array
		$this->options = !empty($options) ? $options : array();
		
		// default to the main nodes colletion if another one is not passed
		$this->collection = !empty($collection) ? $collection : Mongo_Nodes::instance();
	}
	
	// run the map reduce against the colletion
	public function run()
	{
		$results = $this->collection->mapreduce($this->query(), $this->map(), $this->reduce());
		
		if(!$results["ok"])
		{
			return null;
		}
		
		$retval = $results["retval"];
		
		if(!$retval["ok"])
		{
			return null;
		}
		
		return $this->process_results($retval["results"]);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Results
	 *
	 *
	 ********************************************************************************************************************************
	*/
	// process the results you get back and format them into the required return value
	protected abstract function process_results($result_array);
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Query
	 *
	 *
	 ********************************************************************************************************************************
	*/
	// get the query to filter the documents we will apply the mapreduce against
	// this will be turned into JSON (because we are doing this bit raw against mongo)
	protected abstract function query();
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Map
	 *
	 *
	 ********************************************************************************************************************************
	*/
	// get the map function
	//
	// this must be of the format (as an example):
	/*
	
// emit an object containing the keys we want to further reduce
function() {
    emit('position', this._meta.links[0].position);
}	
	
	
	
	*/
	
	abstract protected function map();
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Reduce
	 *
	 *
	 ********************************************************************************************************************************
	*/
	// get the reduce function
	//
	// this must be of the format (as an example):
	/*

// get the key ('position' above) and a list of values for that key
// decide which value to return from the list (i.e. reduce)

function(key, values) {
    var max = values[0];
    values.forEach(function(val){
        if (val > max) max = val;
    })
    
    return max;
}
	
	*/
	abstract protected function reduce();
	
	
	
}
