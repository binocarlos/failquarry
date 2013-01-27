<?php defined('SYSPATH') or die('No direct script access.');

return array
(
    
    // what cache engine have we plugged in?
    'default_cache_engine' => 'memcache',
    
    // where queries should be directed unless otherwise instructed
    'default_storage_factory' => 'mongo',
    
    // the filestore gives apache access to root folder for files (uploaded and system)
    'filestore' => array(
    	
    	// The folder path to the file store
    	'folder' => '/home/webkit/sites/jquarry/filestore',
    
    	// the apache alias onto the file store
    	'alias' => '/filestore'
    	
    ),
    
    // the dnode interface to node.js
    'dnode' => array(
    
    	'require_path' => '/home/webkit/sites/jquarry/modules/jquarry/classes/dnode/vendor/.composer/autoload.php',
    	
    	'port' => 7070
    
    ),
    
    // how the profile behaves
    'profile' => array(

		'key_delimeter' => '___'
		    
    ),
    
    // how does the mongo driver behave
    'mongo' => array(
    
    	// should we automatically convert strings to numbers if they can be?
    	// this will be overtaken by the blueprints
    	'auto_convert_datatypes' => true,
    	
    	// fields we never want to auto convert
    	'dont_auto_convert_node_fields' => array(
    	
    		"name" => true,
    		
    		"_meta.selector_id" => true,
    		
    		"_meta.type" => true,
    		
    		"_meta.classnames" => true
    	
    	)
    	
    ),
    
    // an include is stuff like widgets and plugins
    'includes' => array(
    
    	// include config file
    	'configfile' => 'config.json'
    	
    
    ),
    
    // how should the data tree behave
    'tree' => array(
    
    	'default_child_field' => 'children',
    	
    	'default_link_type' => 'tree',
    	
    	'link_types' => array(
    	
    		'tree' => true,
    		
    		'field' => true
    	
    	)
    	
    ),
    
    // config for the rationalnestedset tree encoder
    'rationalnestedset' => array(
    
    	'encodingpadding' => 10
    	
    ),
    
    // how the components are server
    'server' => array(
    
    	// what is the default index page
    	'index_page' => 'index.htm',
    	
    	// what file types should we process
    	'parse_extensions' => array(
		
			"htm" => true,
			"html" => true
			
		)
    
    ),
    
    // how the components behave
    'component' => array(
    
    	
		
		// the root config for the components
		'root_config' => 'core/config.json',
		
		'directorybased_config' => 'core/directorybased.json'
    
    ),
    
    
    // how the nodes behave
    'node' => array(
    
    
    	'locked_client_properties' => array(
    	
    		// make sure the client can never directly manipulate the links
    		'_meta.links' => true
    		
    	
    	)
    
    
    ),
    
    
    
     /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    // RegExp strings used across jquarry
    
    'regexps' => array(
	
		// variable is a mini-script of the << >> form
		//
		// it runs as a script but replaces the tag with the last return value rather than $server.print
		// 
		// all of the variables you use here are the same as in the script blocks
		//
		// e.g. <<= component.url('logo.png') =>>
		//		<<= request.get('name') =>>
		//		<<= jQuarry..... =>>
		
		"variable" => 	array(					'/',
		
												// start delimiter
												'<<=',
												
												// script inside
												'(.*?)',
												
												// end delimiter
												'=>>',
												
												'/si'
						),
						
		// script is a <script type="quarry"> ... </script>
		//
		// you can point to a script file using the src - the same component based file rules apply
		//
		// this is a server side script block that is executed against the v8 object
		// the v8 exposes the context for this view (usually a component)
		//
		// 
								
		"script" => 	array(					'/',
		
												// start delimiter
												// for it to be a server side script
												'<script ',
												
												// the attributes must contain the word quarry somewhere in the type
												'([^<>]*?)',
												
												// close the starting tag
												'>',
												
												// the actual script contents
												'(.*?)',
												
												// the closing tag
												'<\s*\/\s*script>',
												
												'/si'
						),
						
		// single script is a quarry <script> tag but that points to another file
		//
		// 
								
		"singlescript" => 	array(					'/',
		
												// start delimiter
												// for it to be a server side script
												'<script ',
												
												// the attributes must contain the word quarry somewhere
												'([^<>]*?quarry[^<>]*?)',
												
												// optional closing slash for single tag
												'\/\s*>',
												
												'/i'
						),	
						
		// template is a <template name="bits"> ... </template> tag
		//
		// this is a mustache template that is compiled into a component view
		//
		// this makes the template available to $quarry.template client and server
		//
		//
		// 
								
		"template" => 	array(					'/',
		
												// start delimiter
												// for it to be a server side script
												'<template ',
												
												// the attributes must contain the word quarry somewhere
												'(.*?)',
												
												// optional closing slash for single tag
												'\/?\s*>',
												
												// the actual script contents
												'(.*?)',
												
												// the closing tag
												'<\s*\/\s*template>',
												
												'/si'
						),
						
		// single template is a quarry <template> tag but that points to another file
		//
		// 
								
		"singletemplate" => 	array(					'/',
		
												// start delimiter
												// for it to be a server side script
												'<template ',
												
												// the attributes must contain the word quarry somewhere
												'(.*?)',
												
												// optional closing slash for single tag
												'\/\s*>',
												
												'/i'
						),														
		
		
		// args is for extracting XML style attributes from tags but where we dont want to parse it as XML
		//
		// for for example: <script type="quarry" src="...">
		//
		// will want to give an array with type and src props
		//
		// this is a preg_match_all
								
		"args" => 	array(						'/',
		
												// the name of the arg (word.word format)
												'([\w\.]+)',
												
												// the equals with optional spaces
												'\s*=\s*',
												
												// value within quotes
												'[\'"](.*?)[\'"]',
												
												'/si'
						),
		
		// jquarry args is for extracting the args from a jquarry selector (it is the same as above but with different operators)
		//
								
		"jquarryargs" => 	array(				'/',
		
												// the opening brakcet
												'\[',
												
												// the name of the field (dot notation allowed)
												'([\w\.]+)',
												
												// the operators
												'\s*([\!\$\^\~=\<\>\|\*]+)\s*',
												
												// value within quotes
												'([^\s\]]+|[\'"]?.*?[\'"]?)',
												
												// closing bracket
												'\]',
												
												'/si'
						)			
							
		
	)
    
   
    
);