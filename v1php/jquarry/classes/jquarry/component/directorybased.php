<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Directory Based Component - a component that has a 'home' folder containing files
 * this means it can open files and run views from them etc
 *
 * this includes websites / plugins / applications etc
 *
 * each one can inherit from another one which means they have a cascading file system
 *
 * each folder can contain a config.(xml|json) which configures how the component behaves
 * this config is merged into the parents config
 *
 *
 *
 * 
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/components/directorybased.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Component_Directorybased extends Jquarry_Component {
	
	// the names of the config files we will try to find in a components directory
	protected $config_files = array('config.json', 'config.xml');
	
	public function directory()
	{
		return $this->load();
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Config
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function load_config()
	{
		foreach($this->config_files as $file)
		{
			$filepointer = $this->get_file_pointer($file, false);
			
			if($filepointer->exists())
			{
				return Jquarry_Primitive::factory('config', $filepointer->localpath());
			}
		}
		
		return null;
	}
	
	
	// merges the root config with the directorybased override
	protected function get_root_config()
	{
		$root_config = parent::get_root_config();
		
		$directory_config = Jquarry_Primitive::factory('config', Jquarry_Filestore::instance()->path(Kohana::$config->load('jquarry.component.directorybased_config')));
		
		return $root_config->merge($directory_config);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Files
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function cascade_file($file = null, $cascade = true)
	{
		$owner = $cascade ? $this->load_file_owner($file) : $this;
		
		return $owner->directory()->get_file($file);
	}
	
	protected function load_file_owner($file)
	{
		$ret = $this->directory()->get_file($file);

		if(!$ret->exists() && $this->parent!=null)
		{
			return $this->parent->load_file_owner($file);
		}
		
		return $this;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Type helpers
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public function is_directory()
	{
		return true;
	}
	
}
