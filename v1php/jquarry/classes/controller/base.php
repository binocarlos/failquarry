<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * Base controller for all jquarry
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/controller/base.php
 * @package    	JQuarry
 * @category   	Base
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Controller_Base extends Controller {

	// the profile to use for this page
	protected $profile = null;
	
	// singleton
	public static $instance = null;
	
	/**
	 * Checks if current HTTP request is made through AJAX.
	 *
	 * @return boolean
	 */
	protected function is_ajax()
	{
		if (empty($_SERVER['HTTP_X_REQUESTED_WITH'])) return false;
		return ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest');
	}
	
	/********************************************************************************************************************************
	 *
	 * wrapper
	 *
	 ******************************************************************************************************************************** 
	 */
 	 
	public function before()
	{
	
	}
	
	public function after()
	{
		
	}
	
	
	
	/********************************************************************************************************************************
	 *
	 * Views
	 *
	 ******************************************************************************************************************************** 
	 */
	 
	/*
	protected function process_view($source, Jquarry_Includes_Pagebased $context = null)
	{
		$view = Jquarry_view::factory($source);
		
		$this->response->body($view->render($context));	
	}
	*/
	
	/********************************************************************************************************************************
	 *
	 * HTTP
	 *
	 ******************************************************************************************************************************** 
	 */
	 
	// kohana parameters passed via bootstrap
	protected function param($field)
	{
		return $this->request->param($field);
	}
	
	// GET
	protected function get($field, $wholequerystring = false)
	{
		$ret = $this->request->query($field);
		
		if(empty($ret) && $wholequerystring)
		{
			$ret = $this->querystring();
		}
		
		return $ret;
	}
	
	// POST
	protected function post($field)
	{
		return $this->request->post($field);
	}
	
	protected function querystring()
	{
		// this worked with apache - with nignx php-fpm we need the below
		//return urldecode($_SERVER['QUERY_STRING']);
		
		$parts = explode('?', $_SERVER['REQUEST_URI']);
		
		return $parts[1];
	}
	
	// run through each until there is a value
	protected function getpostmultiple($fields, $allow_whole_query_string)
	{
		foreach($fields as $field)
		{
			$val = $this->getpost($field, $allow_whole_query_string);
			
			if(!empty($val))
			{
				return $val;
			}
		}
		
		return null;
	}
	
	// GET or POST
	protected function getpost($field, $allow_whole_query_string)
	{
		if(is_array($field))
		{
			return $this->getpostmultiple($field, $allow_whole_query_string);
		}
		
		$ret = $_SERVER['REQUEST_METHOD'] == 'POST' ? $this->post($field) : $this->get($field);
		
		if(empty($ret) && $allow_whole_query_string)
		{
			$ret = $this->querystring();
		}
		
		return $ret;
	}
	
	public function action_404($page)
	{
		$this->response->body("The page: {$page} cannot be found");
	}
	
	
	/********************************************************************************************************************************
	 *
	 * Javascript
	 *
	 ******************************************************************************************************************************** 
	 */
	
	// this takes html content and converts it into a document.write javascript response
	// basically a way of taking one page and injecting it into another remotely via a script
	protected function inject($html)
	{
		$this->javascript_header();
		$this->response->body($this->document_write($html));
	}
	
	protected function javascript_header()
	{
		$this->response->headers('Content-Type', 'application/x-javascript');	
	}
	
	protected function css_header()
	{
		$this->response->headers('Content-Type', 'text/css');	
	}
	
	protected function json_header()
	{
		$this->response->headers('Content-Type', 'application/json');	
	}
	
	// prepares HTML to be written with document.write()
	protected function document_write($html)
	{
		$html = str_replace('\'', '\\\'', $html);
		$html = str_replace('/', '\\/', $html);
		$html = preg_replace("/[\n\r]+/", "'\n+'", $html);
		
		$html = "document.write('".$html."');";
		
		return $html;
	}
	
	// JS
	protected function javascript($data)
	{
		$this->_template = null;
		
		$this->javascript_header();
		
		$this->response->body($data);
	}
	
	// CSS
	protected function css($data)
	{
		$this->_template = null;
		
		$this->css_header();
		
		$this->response->body($data);
	}
	
	// JSON
	protected function json($data)
	{
		$this->_template = null;
		
		$this->json_header();
		
		if(!is_string($data))
		{
			$data = json_encode($data);
		}
		
		$this->response->body($this->jsonp($data));
	}
	
	protected function jsonp($content)
	{
		// lets see if we are in JSONP mode
		$jsonp = $this->request->query("jsonp");
		
		if(!empty($jsonp))
		{
			$content = $jsonp.'('.$content.');';
		}
		
		return $content;
	}
	
	
}
