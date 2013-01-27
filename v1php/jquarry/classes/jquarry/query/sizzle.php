<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Sizzle - our own version of a css selector parser (cos we ain't clever enough to get the bleeding sizzle ports to work without a DOM)
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/query/sizzle.php
 * @package    	JQuarry
 * @category   	query
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Query_Sizzle {
		
	/**
	 ********************************************************************************************************************************
	 *
	 * Static Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected static $_chunker_parts =	array('/',
	
												'(\w+)?\(?',		// function name (1 or none)
												
												'(\w+:(\w+:)?\/)?', // drive location
																		
												'([\w]+)?',			// type (1 or none)
												
												'(\#\w+)?',			// id (1 or none)
												
												'([\.\w]+)*',		// class (many or none)
												
												'((\[.*?\])+)*',	// attribute (many or none)
												
												'(:[^\s]+)*',		// modifier (many or none)
												
												'\)?',				// close function
												
												'|',				// OR
												
												
												'([\*])?',		// special selectors
																	// * = all items
																		
												'|', 				// OR
																		
																		
												'([,<>]+)?',		// splitters (>> > << < ,) - this splits stages (>,<) or phases (,)
												
												'/i');
												
												
	public static function factory($selector)
	{
		return new Jquarry_Query_Sizzle($selector);
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected $selector;
	protected $chunker;
	protected $chunks = array();
	
	protected function __construct($selector)
	{
		$this->selector = $selector;
		
		$this->chunker = implode('', Jquarry_Query_Sizzle::$_chunker_parts);
		
		$this->parse();
	}
	
	protected function parse()
	{
		if(preg_match_all($this->chunker, $this->selector, $matches, PREG_SET_ORDER))
		{
			foreach($matches as $match)
			{
				$string = $match[0];
				
				if(empty($string)) { continue; }
				
				$info = array(
				
					'type' => $match[1],
					'id' => $match[2],
					'classnames' => $match[3],
					'attributes' => $match[4],
					'modifiers' => $match[6],
					'special' => $match[8],
					
				);
				
				$this->chunks[] = $info;
			}
		}
	}
	
	public function chunks()
	{
		return $this->chunks;
	}
}
