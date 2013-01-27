/*
 * @filename   	robject/index.js
 * @package    	robject
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * robject - gets the job done proper
 *
 * A general purpose cascading merging backfliping object that can:
 *
 *  * be pointed at a JSON config file - or a series of them for hierarchical merging
 *  * use dot or colon notation to read and write values
 *
 *
 */
 
define([

	'jahmerge',
	
	'underscore'
	
], function(

	jahmerge,
	
	_
	
) {

 
	var makeARobject = function(data) {
		
		this.data = data || {};
		
		// a check so we know if something is a robject or normal object
		this._isRobject = true;
		
		this.access = function(path, val) {
			
			var setMode = typeof val !== 'undefined';
			
			var o = this.data;
			
		    path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
		    path = path.replace(/^\./, '');           // strip a leading dot
		    var a = path.split('.');
		    while (a.length) {
		        var n = a.shift();
		        // this means we have found the key
		        if (n in o) {
		        	if(a.length<=0 && setMode) { // we are on the last property and want to write
		        		o[n] = val;
		        	}
		            o = o[n];
		        // we have not found the key and are on the last part
		        } else if(a.length<=0 && setMode) { // we are on the last property and want to write
		        	o[n] = val;
		        		
		        	return val;
		        } else if(setMode) {
		        	// make space because we are setting
		        	o[n] = {};
		        	
		        	o = o[n];
		        } else {
		        	// we are not setting - no value found
		            return;
		        }
		    }
		    return o;
		}
		
		this.replace = function(newData) {
			
			this.data = newData._isRobject ? newData.data : newData;
			
		};
		
		this.get = function(path) {
			
			if(_.isEmpty(path)) {
				return this.data;
			}
			
			return this.access(path);
		};
		
		this.set = function(path, value) {
			
			return this.access(path, value);
			
		};
		
		this.rawData = function() {
			
			return this.data;
			
		};
		
		this.addData = function(data) {
			
			jahmerge(true, this.data, data);
			
		};
		
		
	};
	
	return {
		
		factory: function(data) {
		
			var obj = new makeARobject(data);
		
			return obj;
		
		}
	}
	
});