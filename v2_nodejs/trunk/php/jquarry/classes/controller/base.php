<?php defined('SYSPATH') or die('No direct script access.');
/**
 * @class Controller.Base
 * @extends Controller
 * @filename   	classes/controller/base.php
 * @package    	controllers
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * Base controller for the PHP quarry stack
 *
 */

class Controller_Base extends Controller {

	
	/**
	 * Checks if current HTTP request is made through AJAX.
     * @return {Boolean}
	 */
	protected function is_ajax()
	{
		if (empty($_SERVER['HTTP_X_REQUESTED_WITH'])) return false;
		return ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest');
	}
	
	/*
	 * Called before the action method
	 */
	public function before()
	{
	
	}
	
	/**
	 * Called after the action method
	 */
	public function after()
	{
		
	}
	
	/*
	 * kohana parameters passed via bootstrap
	 * @param {String} field
	 * @return {String}
	 */
	protected function param($field)
	{
		return $this->request->param($field);
	}
	
	/*
	 * returns a value from the QUERY_STRING
	 * you can ask for the whole query string if the specified parameter is not there:
	 *
	 *		query?city.south
	 *
	 * is where you want the whole query string not a specific field
	 * @param {String} field
	 * @param {Boolean} wholequerystring
	 * @return {String}
	 */
	protected function get($field, $wholequerystring = false)
	{
		$ret = $this->request->query($field);
		
		if(empty($ret) && $wholequerystring)
		{
			$ret = $this->querystring();
		}
		
		return $ret;
	}
	
	/*
	 * returns a value from the POST data
	 * @param {String} field
	 * @return {String}
	 */
	protected function post($field)
	{
		return $this->request->post($field);
	}
	
	/*
	 * returns the raw QUERY_STRING
	 * @return {String}
	 */
	protected function querystring()
	{
		// this worked with apache - with nignx php-fpm we need the below
		//return urldecode($_SERVER['QUERY_STRING']);
		
		$parts = explode('?', $_SERVER['REQUEST_URI']);
		
		return $parts[1];
	}
	
	/*
	 * run through each of the given fields until there is a value found
	 * @param {Array} fields
	 * @param {Boolean} allow_whole_query_string
	 * @return {String}
	 */
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
	
	/*
	 * return the given field from GET or POST whichever is given
	 * @param {String} field
	 * @param {Boolean} allow_whole_query_string
	 * @return {String}
	 */
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
	
	/*
	 * the method that is triggered when something can't be found
	 * @param {String} page the url of the page not found
	 */
	public function action_404($page)
	{
		$this->response->body("The page: {$page} cannot be found");
	}
	 
	/*
	 * this takes html content and converts it into a document.write javascript response
	 * basically a way of taking one page and injecting it into another remotely via a script tag
	 *
	 * @param {String} html the HTML source to convert
	 */
	protected function inject($html)
	{
		$this->javascript_header();
		$this->response->body($this->document_write($html));
	}
	
	/*
	 * prepares HTML to be written with document.write()
	 * it does this by wrapping each line in single quotes and outputting all lines as a concatenated
	 * @param {String} html the HTML source to convert
	 */
	protected function document_write($html)
	{
		$html = str_replace('\'', '\\\'', $html);
		$html = str_replace('/', '\\/', $html);
		$html = preg_replace("/[\n\r]+/", "'\n+'", $html);
		
		$html = "document.write('".$html."');";
		
		return $html;
	}
	
	/*
	 * Add content-type header for javascript
	 */
	protected function javascript_header()
	{
		$this->response->headers('Content-Type', 'application/x-javascript');	
	}
	
	/*
	 * Add content-type header for css
	 */
	protected function css_header()
	{
		$this->response->headers('Content-Type', 'text/css');	
	}
	
	/*
	 * Add content-type header for JSON
	 */
	protected function json_header()
	{
		$this->response->headers('Content-Type', 'application/json');	
	}
	
	/*
	 * Adds the javascript header for the page content
	 * @param {String} data
	 */
	protected function javascript($data)
	{
		$this->javascript_header();
		
		$this->response->body($data);
	}
	
	/*
	 * Adds the css header for the page content
	 * @param {String} data
	 */
	protected function css($data)
	{
		$this->css_header();
		
		$this->response->body($data);
	}
	
	/*
	 * Adds the json header for the page content and JSON encodes it if
	 * its not a string
	 * @param {String} data
	 */
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
	
	/*
	 * Renders the given content back into a JSONP callback function
	 * @param {String} data
	 */
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
