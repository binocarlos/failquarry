<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Cache Controller - serves the minified js & css held in memcached
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/controller/cache.php
 * @package    	JQuarry
 * @category   	Controller
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Controller_Cache extends Controller_Base {
	
	public function action_index()
	{
		$this->action_cache();
	}

	public function action_cache()
	{
		$query = $this->param('query');
		
		$parts = explode('/', $query);
		
		$cachekey = $parts[0];
		$profilename = $parts[1];
		$filename = $parts[2];
		
		$profile = Jquarry_Componentcache::getrawprofile($cachekey, $profilename, 'client');
		
		$source = '';
		
		foreach($profile["files"] as $file)
		{
			if($file->cachefile()==$filename)
			{
				$source = $file->cachecontents();
			}
		}
		
		echo $source;
	}
	
	
	
}