<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Selector Splitter Stage - instructions for how the last stage related to this one
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/query/selectorstage/text.php
 * @package    	JQuarry
 * @category   	query
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
abstract class Jquarry_Query_Selectorstage_Splitter extends Jquarry_Query_Selectorstage {
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public static function factory($splitter)
	{
		$splitter = Tools_Php::chomp($splitter);
		
		$type = 'default';
		
		// direct-child type
		if(empty($splitter))
		{
			$type = 'default';	
		}
		else if($splitter==',')
		{
			$type = 'phase';
		}
		else if($splitter=='>')
		{
			$type = 'child';
		}
		else if($spliter=='>>')
		{
			$type = 'descendant';
		}
		// direct-parent type
		else if($splitter=='<')
		{
			$type = 'parent';
		}
		else if($splitter=='<<')
		{
			$type = 'ancestor';	
		}
		
		// set the default type
		$type = $type=='default' ? 'descendant' : $type;
		
		$classname = 'Jquarry_Query_Selectorstage_Splitter_'.ucfirst($type);
		
		return new $classname();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function __construct()
	{
		
		
	}
	
	public function is_splitter()
	{
		return true;
	}
	
	public function up()
	{
		return $this->direction()==-1;
	}
	
	public function down()
	{
		return $this->direction()==1;
	}
	
	public function direct()
	{
		return $this->depth()==1;	
	}
	
	abstract public function direction();
	
	abstract public function depth();
	
}
