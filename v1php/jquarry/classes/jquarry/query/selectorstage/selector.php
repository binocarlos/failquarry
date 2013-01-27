<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Selector Text Stage - a stage processed against the actual selector string
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
class Jquarry_Query_Selectorstage_Selector extends Jquarry_Query_Selectorstage {
	
	protected $_attributes_split_regexp = 		'/\s*,\s*/';
	protected $_attributes_fieldname_regexp = 	'/^\[(\w+)\]$/';
	
	protected $_attributes_value_regexp_parts =	array('/^\[',
	
												'(\w+)',				// field name
												
												'\s?([\*\|\~\!=><\$\^]+)\s?', 	// spaces and operator
												
												'["\']?(.*?)["\']?',		// value in optional quotes
												
												'\]$/i');
	
	
	public $id = '';
	
	public $type = '';
	
	// the classnames the nodes must have
	public $classnames = array();
	
	// the attribute filter
	public $attributes = array();
	
	// the various modifiers for the selector
	public $modifiers = array();
	
	protected function __construct($sizzleinfo)
	{
		if($sizzleinfo['id'])
		{
			$this->id = preg_replace('/^#/', '', $sizzleinfo['id']);
		}
		
		// type will come with a ':' delimiter - change it to a '.'
		if($sizzleinfo['type'])
		{
			$this->type = preg_replace('/:/', '.', $sizzleinfo['type']);
		}
		
		if($sizzleinfo['classnames'])
		{
			$classnames = preg_replace('/^\./', '', $sizzleinfo['classnames']);
			
			$this->classnames = explode('.', $classnames);
		}
		
		if($sizzleinfo['attributes'])
		{
			$this->attributes =  Tools_Jquarry::extract_jquarry_args($sizzleinfo["attributes"]);
		}
		
		if($sizzleinfo['modifiers'])
		{
			$modifiers = preg_replace('/^:/', '', $sizzleinfo['modifiers']);	
			
			$modifiers = explode(':', $modifiers);
			
			foreach($modifiers as $modifier)
			{
				if(preg_match('/^(\w+)(.*?)$/', $modifier, $match))
				{
					$this->add_modifier($match[1], $match[2]);
				}
				
			}
		}
		
		if($sizzleinfo['special'])
		{
			$sizzleinfo['special'] = preg_replace('/\s/', '', $sizzleinfo['special']);
			
			if($sizzleinfo['special']=='/')
			{
				$this->add_modifier('orphan');
			}
			
			if($sizzleinfo['special']=='*')
			{
				$this->add_modifier('all');
			}
		}
		
	}
	
	public function add_modifier($name, $options)
	{
		$this->modifiers[$name] = $options;	
	}
	
	public function has_modifier($name)
	{
		return isset($this->modifiers[$name]);	
	}
	
	public function has_type()
	{
		return !empty($this->type);
	}
	
	public function type()
	{
		return $this->type;
	}
	
	public function has_id()
	{
		return !empty($this->id);
	}
	
	public function id()
	{
		return $this->id;
	}
	
	public function has_classnames()
	{
		return count($this->classnames())>0;
	}
	
	public function classnames()
	{
		return $this->classnames;
	}
	
	public function has_attributes()
	{
		return count($this->attributes())>0;
	}
	
	public function attributes()
	{
		return $this->attributes;
	}
	
	public function has_modifiers()
	{
		return count($this->modifiers())>0;
	}
	
	public function modifiers()
	{
		return $this->modifiers;
	}
	
	public function is_selector()
	{
		return true;
	}
	
}
