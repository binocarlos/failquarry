<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry View - a chunk of code to be processed before rendered
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/view.php
 * @package    	JQuarry
 * @category   	view
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_View {
	
	// the source for the view
	protected $source;
	
	// the context the view is being run in
	protected $context;
	
	// keep track of the number of times we need to process the view
	protected $processor = array(
	
		"passes" => 0,
		
		"hits" => 0
		
	);
	
	// the template tags this view contains (array of View_Templates)
	protected $templates = array();
	
	public function factory($source, $context)
	{
		return new Jquarry_View($source, $context);
	}
	
	protected function __construct($source, $context)
	{
		$this->source = $source;
		
		// the default context is a blank directory based component
		$this->context = $context==null ? Jquarry_Component::factory() : $context;
	}
	
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Render - process the view and return the results
	 *
	 * the context to render is the object that essentially owns the view (widget/application etc)
	 *
	 ********************************************************************************************************************************
	 *
	*/
	
	// this is run when the source is assumed to be script content
	// the view returns the output of the script (as in page output)
	public function runscript()
	{
		return $this->process_script($this->source);
	}
	
	public function render()
	{
		// keep processing while we have stuff to do
		while($this->process())
		{
			
		}
		
		return $this->source;
	}
	
	public function process()
	{
		$this->processor["passes"]++;
		$this->processor["hits"] = 0;
		
		$this->process_templates();
		$this->process_variables();
		$this->process_scripts();
		
		return $this->processor["hits"] > 0;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Scripts - run the server side jquarry scripts
	 *
	 ********************************************************************************************************************************
	 *
	*/	
	
	protected function process_scripts()
	{
		$this->source = preg_replace_callback(
		
			$this->regexp("singlescript"),
			
			array($this, "process_script_hit"),
			
			$this->source
			
		);
		
		$this->source = preg_replace_callback(
		
			$this->regexp("script"),
			
			array($this, "process_script_hit"),
			
			$this->source
			
		);
		
	}
	
	protected function process_script_hit($match)
	{

		$args = $this->extract_args($match[1], array(
		
			"echo" => null
		
		));
		
		// if we don't have quarry in the type then we are a client side script (just return whole match back to the view)
		if(!preg_match('/quarry/i', $args["type"]))
		{
			return $match[0];
		}
		
		$this->processor["hits"]++;
		
		// are we pointing to a server side script file elsewhere?
		if(!empty($args["src"]))
		{
			$script = $this->get_component_file($args["src"]);
			
			return $this->process_script($script, $args["echo"]);
		}
		// no so lets run the contents of the script tag as the script
		else
		{
			$script = $match[2];
			
			return $this->process_script($script, $args["echo"]);
		}
		
	}
	
	// process some text as a script using the current context in the sandbox
	// if the return mode is sandbox then return it's output
	// otherwise return the returned value of the script
	//
	// return mode controls what the tag is replaced by - either the last defined variable (script) or the contents of the page print (print)
	protected function process_script($source, $echo = null)
	{
		$script = $this->extract_file_text($source);
		
		$v8 = Jquarry_V8::instance();

		$sandbox = new Jquarry_View_Sandbox($this);
		
		// run the script passing the sandbox through to the JS environment
		if($v8->run($script, array("sandbox" => $sandbox)))
		{
			$echo = empty($echo) ? 'server' : $echo;
			
			// we ran succesfully now decide what to return
			return $echo == 'server' ? $sandbox->output() : $v8->result();
		}
		else
		{
			// we have an error so lets return the error message
			return $v8->errorMessage();
		}
	}
	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Variables are basically mini chunks of script but where the last return value from the chunk of script is replaced rather
	 * than $server.print
	 *
	 ********************************************************************************************************************************
	 *
	*/
	
	public function process_variables()
	{
		$this->source = preg_replace_callback(
		
			$this->regexp("variable"),
			
			array($this, "process_variable"),
			
			$this->source
			
		);
	}
	
	public function process_variable($match)
	{
		$this->processor["hits"]++;
		
		return $this->process_script($match[1], 'script');
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Templates are processed before anything else and are available to server side and client side jquarry.template functions
	 *
	 ********************************************************************************************************************************
	 *
	*/
	
	public function process_templates()
	{
		$this->source = preg_replace_callback(
		
			$this->regexp("singletemplate"),
			
			array($this, "process_template"),
			
			$this->source
			
		);
		
		$this->source = preg_replace_callback(
		
			$this->regexp("template"),
			
			array($this, "process_template"),
			
			$this->source
			
		);
		
	}
	
	public function process_template($match)
	{
		$this->processor["hits"]++;
		
		$args = $this->extract_args($match[1], array(
		
			"name" => "template".$this->processor["passes"]."_".$this->processor["hits"]
		
		));
		
		$template_source = '';
		
		// are we pointing to a server side script file elsewhere?
		if(!empty($args["src"]))
		{
			$template_file = $this->get_component_file($args["src"]);
			
			if($template_file && $template_file->exists())
			{
				$template_source = $this->extract_file_text($template_file);
				
				$args["name"] = preg_replace('/\.\w+$/', '', $args["src"]);
			}
		}
		// no so lets run the contents of the script tag as the script
		else
		{
			$template_source = $match[2];
		}
		
		$template = new Jquarry_View_Template($template_source, $args);
		
		$name = $template->name();
		
		$this->templates[$name] = $template;
		
		$replace=<<<EOT
<!-- jQuarry server side template: {$name} -->

<script id="jquarry_template_{$name}" type="text/html">

<div>
$template_source
</div>

</script>
EOT;

		return $replace;
	}
	
	public function get_template($name)
	{
		return $this->templates[$name];	
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Tools
	 *
	 ********************************************************************************************************************************
	 *
	*/
	
	protected function extract_args($string, $defaults = array())
	{
		return Tools_Jquarry::extract_args($string, $defaults);
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * this extracts the text from whatever you give it
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function extract_file_text($source)
	{
		if(is_string($source))
		{
			return $source;
		}
		else if(is_object($source))
		{
			if(is_a($source, Jquarry_Primitive::classname('file')))
			{
				return $source->get_contents();
			}
			else if(is_a($source, 'Kohana_View'))
			{
				return $source->render();
			}
		}
		
		return '';
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Regexps
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function regexp($name)
	{
		return Tools_Jquarry::regexp($name);
	}	
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Component Files
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected function get_component_file($path)
	{
		// if we have a context then ask it for the file
		// it will look after component pointers
		if($this->context)
		{
			return $this->context->get_file($path);
		}
		// if we don't have a context we try a straight component pointer
		else
		{
			$pointer = Jquarry_Component::process_linked_pointer($path);
		
			// do we have a pointer to another component?
			if($pointer && $pointer["componentobj"]->exists())
			{
				return $pointer["componentobj"]->get_file($path);
			}
		}
		
		return null;
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Getters
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	// this will ask the current context component whether it is reponsible for dealing with files and such forth
	// in the case of file based components (like webpages) - they will defer this request up to their container
	// (a.k.a the website)
	public function context()
	{
		return $this->context->get_context();
	}
	
}
