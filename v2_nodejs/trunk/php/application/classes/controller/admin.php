<?php defined('SYSPATH') or die('No direct script access.');
/**
 * @class Controller.Website
 * @extends Controller.Base
 * @filename   	classes/controller/website.php
 * @package    	controllers
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * Website Controller - takes URLs from websites and serves them
 *
 */

class Controller_Admin extends Controller_Adminbase {
	
	protected $_wrap = false;
	
	protected $_page_title = '';
	protected $_section_title = '';
	
	protected $_menu = '';
	
	/**
	 * Check if we have a wrapper view to render
	 */
	public function after()
	{
		if($this->_wrap) {
		
			$wrapper_view = View::factory('wrapper');
			
			$wrapper_view->body = $this->response->body();
			$wrapper_view->page_title = $this->_page_title;
			$wrapper_view->section_title = $this->_section_title;
			$wrapper_view->menu = $this->_menu;
			
			$this->response->body($wrapper_view->render());
		}
	}
	
	public function installation_menu($active)
	{
		$activeclass = ' class="active"';
		
		$menus = array(
			array(
				'id' => 'home',
				'title' => 'Home',
				'link' => '/admin'
			),
			array(
				'id' => 'add',
				'title' => 'Add',
				'link' => '/admin/installation'
			)
		);
		
		if(empty($active)) { $active = 'home'; }
		
		$txt = '';
		
		foreach($menus as $m)
		{
			$class = $active==$m['id'] ? ' class="active"' : '';
			
			$txt.=<<<EOT
	
<li><a href="{$m['link']}"{$class}>{$m['title']}</a></li>

EOT;
		}
		
		$this->_menu=$txt;
	}
	
	public function action_index()
	{
		$this->_wrap = true;
		$this->_page_title = 'Home';
		$this->_section_title = 'Installations';
		
		$this->installation_menu();
		
		$installationarray = ORM::factory('installation')->find_all();
		
		$view = View::factory('installations');
		
		$view->installations = $installationarray;
		$view->message = $this->get('message');
		
		$this->response->body($view->render());
	}
	
	public function action_rabbit()
	{
		$this->_wrap = true;
		$this->_page_title = 'Home';
		$this->_section_title = 'Rabbit';
		
		$view = View::factory('rabbit');
		
		$this->response->body($view->render());
	}
	
	public function action_installation()
	{
		$installation = ORM::factory('installation', $this->param('id'));
		
		if($installation->loaded())
		{
			$this->render_installation($installation);
		}
		else
		{
			$this->render_addinstallation();
		}
	}
	
	public function action_createinstallation()
	{
		$this->_wrap = true;

		$installation = ORM::factory('installation', $this->param('id'));
		
		$controller = $this;
		
		$createobj = array(
			"name" => "createaccount",
			"config" => array(
				"installation_name" => $_POST['fullname'],
				"website" => array(
					"subdomain" => $_POST['subdomain']	
				),
				"user" => array(
					"name" => $_POST['fullname'],
					"quarry" => $_POST['username'],
					"quarrypassword" => $_POST['password']
				)
			)
		);
		
		$validate = array('subdomain', 'fullname', 'username', 'password');
		
		foreach($validate as $k) {
			if(empty($_POST[$k])) {
				$this->render_addinstallation('Please complete the '.$k.' field');
				return;
			}	
		}
		
		$rpcclient = Dnodeclient::factory();
		
		$result = $rpcclient->createInstallation($createobj);
		
		if(!empty($result->error)) {
			
			$this->render_addinstallation($result->error);
				
		} else {
				
			$this->request->redirect('/admin?message=Installation+Saved');
				
		}
		
		
	}
	
	
	public function action_saveinstallation()
	{
		$this->_wrap = true;

		$installation = ORM::factory('installation', $this->param('id'));
		
		$controller = $this;
		
		$installation->name = $_POST['name'];
		$installation->root = $_POST['root'];
		$installation->config = $_POST['config'];
		
		$rpcclient = Dnodeclient::factory();
		
		$test = $rpcclient->createInstallation($installation_raw);
		
		echo 'answer = '.$test;
		exit;
		
	}
	
	protected function render_addinstallation($error)
	{
		$addview = View::factory('add');
		$this->installation_menu('add');
		$this->_page_title = 'Add Installation';
		$addview->error = $error;
		$this->_wrap = true;
		$this->response->body($addview->render());	
	}
	
	protected function render_installation($installation)
	{
		$this->_wrap = true;
		
		$this->installation_menu($installation->loaded() ? null : 'add');

		$view = View::factory('installation');
		
		$view->installation = $installation;
		
		$this->_page_title = $installation->loaded() ? $installation->name : 'Add';
		
		$body = $view->render();
		
		if($installation->loaded()) {
		
			$websites = ORM::factory('website')
				->where('installation_id', '=', $installation->id)
    			->find_all();
    			
    		$websitesview = View::factory('installationwebsites');
    		
    		$websitesview->installation = $installation;
    		$websitesview->websites = $websites;
    		
    		$body .= $websitesview->render();
    		
    		$users = ORM::factory('user')
				->where('installation_id', '=', $installation->id)
    			->find_all();
    			
    		$usersview = View::factory('installationusers');
    		
    		$usersview->installation = $installation;
    		$usersview->users = $users;
    		
    		$body .= $usersview->render();
			
		}
		
		$this->response->body($body);
	}
	
	public function action_website()
	{
		$this->_wrap = true;

		$installation = ORM::factory('installation', $this->param('id'));
		$website = ORM::factory('website', $this->param('subid'));
		
		$view = View::factory('website');
		
		$view->installation = $installation;
		$view->website = $website;
		
		$this->_page_title = $installation->name.' : '.($website->loaded() ? $website->name : 'New Website');
		
		$this->installation_menu();
		
		$this->response->body($view->render());
	}
	
	public function action_user()
	{
		$this->_wrap = true;

		$installation = ORM::factory('installation', $this->param('id'));
		$user = ORM::factory('user', $this->param('subid'));
		
		$view = View::factory('user');
		
		$view->installation = $installation;
		$view->user = $user;
		
		$this->_page_title = $installation->name.' : '.($user->loaded() ? $user->name : 'New User');
		
		$this->installation_menu();
		
		$this->response->body($view->render());
	}
	
}