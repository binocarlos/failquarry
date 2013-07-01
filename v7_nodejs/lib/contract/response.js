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
var _ = require('lodash');

/*

  quarry.io - network request

  basic version of http.serverRequest
  
*/

module.exports = Response;

function Response(data){
  Message.apply(this, [data]);
  this.statusCode = data ? data.statusCode : 200;
}

Response.factory = function(data){

  /*
  
    sort out the constructor so you can quickly
    create responses with the callback hooked up
    
  */
  var fn = null;

  if(_.isFunction(data)){
    fn = data;
    data = null;
  }

  var ret = new Response(data);

  if(fn){
    ret.on('send', function(){
      fn(null, ret);
    })
  }

  return ret;
}

util.inherits(Response, Message);

Response.prototype.statusCode = 200;

Response.prototype.fill = function(data){
  _.extend(this, _.isString(data) ? JSON.parse(data) : data);
  this.send()
}

Response.prototype.update = function(data){
  _.extend(this, _.isString(data) ? JSON.parse(data) : data);
}

Response.prototype.send = function(body){
  arguments.length>0 && (this.body = body);
  this.emit('beforesend');
  this.emit('send');
  this.headerSent = true;
  return this;
}

Response.prototype.containers = function(body){
  this.setHeader('content-type', 'quarry/containers');
  this.body = body;
  return this;
}

Response.prototype.json = function(body){
  this.setHeader('content-type', 'application/json');
  this.body = body;
  return this;
}

Response.prototype.send404 = function(){
  this.statusCode = 404;
  return this.send('resource not found');
}

Response.prototype.error = function(body){
  this.statusCode = 500;
  return this.send(body);
}

Response.prototype.hasError = function(){
  return this.statusCode>=400 || ((this.getHeader('x-json-quarry-errors') || []).length>0);
}

Response.prototype.getError = function(){
  if(!this.hasError()){
    return null;
  }

  return _.filter([this.body].concat(this.getHeader('x-json-quarry-errors') || []), function(val){
    return !_.isEmpty(val);
  }).join(', ');
}

Response.prototype.toJSON = function(){
  var ret = Message.prototype.toJSON.apply(this);

  ret.statusCode = this.statusCode;

  return ret;
}

/*

  grabs an array of responses from either multipart or single
  
*/
Response.prototype.flatten = function(){

  var all = [];

  this.recurse(function(res){
    all.push(res);
  })

  return all;
}

Response.prototype.recurse = function(fn){

  function runres(res){
    if(res.isMultipart()){
      _.each(res.body || [], function(subresbody){
        var subresponse = new Response(subresbody);

        runres(subresponse);
      })
    }
    else{
      fn && fn(res);  
    }
  }

  runres(this);

  return this;
}

Response.prototype.isContainers = function(){
  return this.getHeader('content-type')=='quarry/containers';
}

Response.prototype.isMultipart = function(){
  return this.getHeader('content-type')=='quarry/multipart' || this.getHeader('content-type')=='quarry/contract';
}

Response.prototype.http_content_type = function(){
  var ret = this.getHeader('content-type') || 'text/html';
  return ret.indexOf('quarry/')>=0 ? 'application/json' : ret;
}

Response.prototype.add = function(res){
  if(!res){
    throw new Error('adding null response');
  }
  if(!this.body){
    this.body = [];
  }
  this.setHeader('content-type', 'quarry/multipart');
  if(!res.hasError()){
    this.body = this.body.concat(res.body);
  }
  else{
    var errors = this.getHeader('x-json-quarry-errors') || [];
    errors.push(res.body);
    this.statusCode = res.statusCode;
    this.setHeader('x-json-quarry-errors', errors);
  }
  return this;
}

Response.prototype.summary = function(){
  return this.statusCode + ' ' + (this.hasError() ? this.body : this.getHeader('content-type'));
}

Response.prototype.redirect = function(location){
  this.send('redirect:' + location);
}
/*

  send a quarry response via a HTTP response
  
*/
Response.prototype.httpsend = function(res, body){
  
  /*
  
    all quarry content-types are JSON
    
  */
  _.each(this.headers, function(val, key){
    res.setHeader(key, val);
  })
  res.setHeader('content-type', this.http_content_type());
  res.send(body || this.body);

}