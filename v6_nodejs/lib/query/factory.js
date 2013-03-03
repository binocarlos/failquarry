/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

var _ = require('underscore');
var Request = require('./request');
var Response = require('./response');
var eyes = require('eyes');
var url = require('url');

/*
  Quarry.io - Query Factory
  -------------------------

  Knows how to formulate & process requests for different purposes

  

 */

var api = module.exports = {};

api.fromJSON = function(json){
  return new Request(json);
}

api.resfromJSON = function(json){
  return new Response(json);
}

// a non container query
api.request = function(options){
  options || (options = {});
  options = _.defaults(options, {
    method:'get',
    path:'/',
    body:{}
  })

  var req = new Request(options);

  return req;
}

api.response = function(callback){
  var res = new Response();

  res.on('send', function(){
    callback && callback(res);
  })

  return res;
}

// routes is an array of route info for the context
// selectors is an array of selector strings to be reversed into a pipe
api.selector = function(skeleton, selector){

  var req = new Request({
    method:'get',
    path:'/reception/transaction',
    body:{
      method:'get',
      params:{
        selector:selector
      }
    }
  })

  req.jsonheader('QUARRY-SKELETON', skeleton);

  return req;
}

api.append = function(routes, data){
  
  var req = new Request({
    method:'post',
    path:'/reception/transaction',
    body:{
      method:'post',
      body:data
    }
  })

  req.jsonheader('QUARRY-SKELETON', skeleton);

  return req;
}

api.select = function(options){
  options || (options = {});
  var req = new Request({
    method:'get',
    path:options.path,
    params:{
      'select':options.select,      
      'includestamp':options.includestamp
    }
  })

  req.jsonheader('QUARRY-SKELETON', options.skeleton);

  return req;
}



