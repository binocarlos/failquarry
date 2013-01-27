/*
 * @filename   	jquarry/bootstrap/profile/server.js
 * @package    	bootstrap
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * require.js config for server context
 *
 */

define([], function () {
  
	var baseUrl = typeof window !== "undefined" ? '/_quarry/' : 'js/';
	
	// set the path for the require plugins—text, i18n, etc.
	var paths = {
		
		sandboxrequire:'lib/requirejs/require',
    	text:'lib/requirejs/text'
  	};
  	
	var packages = [
	
		
		// underscore
		{
			name:'underscore',
			location:'lib/underscore',
			main: 'underscore',
			lib: '.'
		},
		
		// async
		{
			name:'async',
			location:'lib/async',
			main: 'async',
			lib: '.'
		},
		
		// async
		{
			name:'jason',
			location:'lib/jason',
			main: 'jason',
			lib: '.'
		},
		
		// uberclass
		{
			name:'uberclass',
			location:'lib/uberclass',
			main: 'class',
			lib: '.'
		},
		
		// dev
		{
			name:'dev',
			location:'lib/dev',
			main: 'dev',
			lib: '.'
		},
		
		// stumble-fs
		{
			name:'stumble-fs',
			location:'lib/stumble-fs',
			main: 'index',
			lib: '.'
		},
		
		// robject
		{
			name:'robject',
			location:'lib/robject',
			main: 'index',
			lib: '.'
		},
		
		
		// ronfig
		{
			name:'ronfig',
			location:'lib/ronfig',
			main: 'index',
			lib: '.'
		},
		
		// jahmerge
		{
			name:'jahmerge',
			location:'lib/jahmerge',
			main: 'index',
			lib: '.'
		},
		
		// base
		{
			name:'base',
			location:'lib/base',
			main: 'base',
			lib: '.'
		},
		
		// bootlace
		{
			name:'bootlace',
			location:'lib/bootlace',
			main: 'bootlace',
			lib: '.'
		},
		
		// bootlaceportals
		{
			name:'bootlaceportals',
			location:'lib/bootlace',
			main: 'bootlaceportals',
			lib: '.'
		},
		
		// config
		{
			name:'config',
			location:'config',
			main: 'index',
			lib: '.'
		},
		
		// component
		{
			name:'component',
			location:'component',
			main: 'component',
			lib: '.'
		},
		
		// registry
		{
			name:'registry',
			location:'registry',
			main: 'broker',
			lib: '.'
		},
		
		// switchboard
		{
			name:'switchboard',
			location:'switchboard',
			main: 'switchboard',
			lib: '.'
		},
		
		// crusher
		{
			name:'crusher',
			location:'crusher',
			main: 'crusher',
			lib: '.'
		},
		
		// doctor
		{
			name:'doctor',
			location:'doctor',
			main: 'doctor',
			lib: '.'
		},
		
		// system
		{
			name:'system',
			// here we split for client / server
			location: 'system',
			main: typeof window !== "undefined" ? 'client' : 'server',
			lib: '.'
		},
		
		// quarry
		{
			name:'quarry',
			location:'quarry',
			// here we split for client / server
			main: 'quarry',
			lib: '.'
		}
		
  	];
  	
  	return {
	
		// this is mapped client or server
		baseUrl: baseUrl,
		
		// set the paths to our library packages
		packages: packages,
			
		// set the path for the require plugins—text, i18n, etc.
		paths: paths
		
	};
	
});