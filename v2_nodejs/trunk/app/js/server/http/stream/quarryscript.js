/*
 * @class 		server.http.stream
 * @filename   	server/http/stream.js
 * @package    	server
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * quarry script stream - will convert the output
 *
 *
 *
 */

define([

	'stream',
	
	'util',
	
	'underscore'
	
	
], function(

	
	stream,
	
	util,
	
	_
	
	
) {
	
	var QuarryStream = function () {
		this.chunks = [];
		this.size = 0;
	  	this.writable = true;
	  	this.readable = true;
	};
	
	util.inherits(QuarryStream, stream.Stream);
	
	QuarryStream.prototype.write = function (chunk) {
		this.chunks.push(chunk);
		return true;
	}
	
	QuarryStream.prototype.end = function () {
		
    	this.emit('data', this.chunks.join(''));
    	this.emit('end');
  	}
	
	return QuarryStream;
	
});