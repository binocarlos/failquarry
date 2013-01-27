<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Action Controller - handles requests from client side jquarry to manipulate the server
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/controller/network.php
 * @package    	JQuarry
 * @category   	Controller
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 ******************************************************************************************************************************** 
 */
class Controller_Dev extends Controller_Base {
	
	
	public function action_index()
	{
		phpinfo();
	}
	
	public function action_test()
	{
		//Jquarry_Profile::instance()->add('framework[jquarry]');
		
		//print_r(Jquarry_Profile::instance());
		//$loader = Dnodeclient::factory();
		
		//$loader->run();
		
		$test=<<<EOT
	
<script data-main="/filestore/123/core/framework/jquarry.client.bootstrap" src="/filestore/123/core/framework/require.js"></script>
		
EOT;

		$this->response->body($test);
	}
		
}