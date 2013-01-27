/*
 * @class JQuarry.Base
 * @filename   	jquarry/base.js
 * @package    	core
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * jQuarry core.js - base level tools for objects an ting - we merge uberclass with the event emitter to make an uber-uber class
 *
 * read [The Uberclass Docs](https://github.com/daffl/uberclass)
 *
 */

define([

	'uberclass',
	
	'./events'
	
], function(uberclass, events) {
	
	// our base class is an events emitter
	var base = uberclass.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		
		
	
	}, 
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	 
	events.EventEmitter.prototype);
	
	return base;
	
});