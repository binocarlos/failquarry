/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/**
 * Module dependencies.
 */

var util = require('util');
var Message = require('./message');
var url = require('url');

var utils = require('../utils');

/*

  quarry.io - network request

  basic version of http.serverRequest
  
*/

module.exports = Request;


function Request(data){
  data || (data = {});
  Message.apply(this, [data]);
  this.url = data.url || '/';
  this.method = data.method || 'get';
  this.query = data.query || {};
  if(this.url.indexOf('?')>=0){
    var parts = this.url.split('?');
    _.extend(this.query, url.parse(this.url, true).query);
    this.url = parts[0];
    this.setHeader('x-query-string', parts[1]);
  }
}

util.inherits(Request, Message);

Request.prototype.toJSON = function(){
  var ret = Message.prototype.toJSON.apply(this);

  ret.url = this.url;
  ret.method = this.method;
  ret.query = this.query;
  ret.headers["x-quarry-url"] = ret.url;

  return ret;
}

Request.prototype.clone = function(){
  return new Request(this.toJSON());
}

Request.prototype.parseurl = function(url){
  if(url.match(/^\w+:\//)){
    var parts = url.split(':');
    var department = parts.shift();
    this.setHeader('x-quarry-department', parts.shift());
    this.url = parts.join(':');
  }
  else{
    this.url = url;
  }
  return this;
}

Request.prototype.isContract = function(){
  return this.getHeader('content-type')=='quarry/contract';
}

Request.prototype.summary = function(){
  return this.method.toUpperCase() + ' ' + (this.getHeader('x-quarry-department') || 'warehouse') + ':' + (this.getHeader("x-quarry-url") || this.url);
}

Request.prototype.skeleton = function(){
  return {
    url:this.url,
    method:this.method,
    query:this.query
  }
}

Request.prototype.has_debug = function(){
  return this.getHeader('x-quarry-debug-id')!=null;
}

Request.prototype.routingpacket = function(){
  return {
    url:this.url,
    method:this.method,
    contenttype:this.getHeader('content-type'),
    department:this.getHeader('x-quarry-department') || 'warehouse',
    stackid:this.getHeader('x-quarry-stackid'),
    debugid:this.getHeader('x-quarry-debug-id'),
    flags:this.getHeader('x-quarry-flags') || {}
  }
}
/*

  update a spawned request (usually from a contract child)
  with the top-level data that has been sent with the top-level contract
  
*/
Request.prototype.inject = function(req){
  req.setHeader('x-json-quarry-user', this.getHeader('x-json-quarry-user'));
  req.setHeader('x-quarry-bayid', this.getHeader('x-quarry-bayid'));
  req.setHeader('x-quarry-resolveid', this.getHeader('x-quarry-resolveid'));
  req.setHeader('x-json-quarry-project', this.getHeader('x-json-quarry-project'));
  req.setHeader('x-quarry-debug-id', this.getHeader('x-quarry-debug-id'));
  return this;
}