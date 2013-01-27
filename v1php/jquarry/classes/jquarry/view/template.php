<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry View Template - a mustache template encountered in a jquarry view
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/view/template.php
 * @package    	JQuarry
 * @category   	view
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_View_Template {
	
	// the source for the template
	protected $text;
	protected $options = array();
	
	public function __construct($source, $options = array())
	{
		$this->text = $source;
		$this->options = $options;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Render - process the view and return the results
	 *
	 ********************************************************************************************************************************
	 *
	*/
	public function render($data)
	{
		$m = new Mustache();
		
		$data = Tools_Php::convert_object_to_array($data);
		
		return $m->render($this->text, $data);
	}
	
	public function name()
	{
		return $this->options["name"];
	}
}
