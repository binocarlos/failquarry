<?php defined('SYSPATH') or die('No direct script access.');
/**
 * @class 		Model.Installation
 * @extends 	Automodeler
 * @filename   	classes/model/installation.php
 * @package    	model
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * Installation model - an installation has several websites and is the base for the jquarry customer
 *
 */

class Model_Installation extends ORM
{
    protected $_table_name = 'installation';    

	public $_error = '';
	
  	public function json()
  	{
  		$ret = array(
  			"id" => $this->id,
  			"name" => $this->name,
  			"root" => $this->root,
  			"config" => $this->config
  		);
  		
  		return $ret;
  	}
  	
  	public function save_form_data($data) {
  		
  		foreach($data as $prop => $val) {
  			$this->$prop = $data[$val];
  		}
  	}
  	
  	
}