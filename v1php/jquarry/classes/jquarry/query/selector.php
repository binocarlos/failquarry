<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Selector Query - selector based query against the tree
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/query/selector.php
 * @package    	JQuarry
 * @category   	query
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Query_Selector extends Jquarry_Query {
	
	// a phase is a different starting point - the results are to be all merged at the end
	// e.g. #products .onsale, #images .big, #blogs .today is 3 phases
	//
	// each phase has stages (split by spaces and other things) - these are run in order
	// the $_phases var is an 2 dimensional array of phase -> stage
	protected $_phases = array();
	
	public function run()
	{
		$factory = $this->storage_factory();
		
		return $factory->run_selector_query($this);
	}
	
	public function phases()
	{
		return $this->_phases;
	}
	
	protected function commit_parse($stage, $mode, $value)
	{
		
	}
	
	public function default_splitter()
	{
		return Jquarry_Query_Selectorstage::factory('>>');
	}
	
	public function get_context_skeleton()
	{
		return $this->config["context_skeleton"];	
	}
	
	protected function parse()
	{
		$sizzle = Jquarry_Query_Sizzle::factory($this->query);
		
		$allphases = array();
		$currentphase = array();
		$laststage = null;
		
		foreach($sizzle->chunks() as $chunk)
		{
			$stage = Jquarry_Query_Selectorstage::factory($chunk);
			
			// have we hit the end of a phase - in which case bank the current one and reset
			if($stage->is_phase_splitter())
			{
				$allphases[] = $currentphase;
				
				$currentphase = array();
				$laststage = null;
				
				continue;
			}
			
			// do we have 2 selectors next to each other (i.e. they were split by a space)
			// in which case insert a blank splitter
			if($stage->is_selector() && $laststage!=null && $laststage->is_selector())
			{
				$currentphase[] = $this->default_splitter();
			}
			
			$currentphase[] = $stage;
			$laststage = $stage;
		}
		
		if(count($currentphase)>0)
		{
			$allphases[] = $currentphase;
		}
		
		$this->_phases = $allphases;
	}
	
	public function nodes_exist()
	{
		return true;
	}
	
}
