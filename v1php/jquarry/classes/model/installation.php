<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Installation ORM model
 *
 ********************************************************************************************************************************
 *
 * @filename   	jquarry/classes/model/installation.php
 * @package    	JQuarry
 * @category   	ORM Models
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Model_Installation extends ORM {

    protected $_table_name = 'installation';

    protected $_primary_key = 'id';
	protected $_primary_val = 'name';

    protected $_filters = array(TRUE => array('trim' => NULL));

    protected $_has_many = array(
    	
    	/*
		'entity' => array(
			'foreign_key' => 'installation_id'
		),
		
		'tree' => array(
			'foreign_key' => 'installation_id'
		),
		
		'link' => array(
			'foreign_key' => 'installation_id'
		),
		
		'path' => array(
			'foreign_key' => 'installation_id'
		)
		*/
    );
    
    public function rules()
    {
    	return array(
    		// name cannot be empty and must be less than 255 chars
    		'name' => array(
    			array('not_empty'),
    			array('min_length', array(':value', 10)),
    			array('max_length', array(':value', 32))
    		)
    	);	
    }
    
}