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
var async = require('async');
var utils = require('./utils');
var eyes = require('eyes');
var nested = require('../vendor/backbonedeep');
var Route = require('./route');

/*
  Quarry.io - Packet
  ------------------

  A packet is an RPC instruction

  It has req & res (request, response)

 


 */

// base class for req and res
var PacketPart = nested.extend({

  getHeader:function(name){
    var headers = this.get('headers') || {};
    return headers[name];
  },

  setHeader:function(name, value){
    var headers = this.get('headers') || {};
    headers[name] = value;
    this.set('headers', headers);
    return this;
  }

})

var Req = PacketPart.extend({
  getParam:function(name){
    var params = this.get('params') || {};
    return params[name];
  },

  setParam:function(name, value){
    var params = this.get('params') || {};
    params[name] = value;
    this.set('params', params);
    return this;
  }
})

var Res = nested.extend({

  send:function(body){
    this.trigger('send', body);
  }

})

var Packet = nested.extend({

  initialize:function(){
    this.req = new Req(this.get('req'));
    this.res = new Req(this.get('res'));
    this.route = new Route(this.get('route'));
  },

  toJSON:function(){
    return {
      req:this.req.toJSON(),
      res:this.res.toJSON(),
      route:this.route.toJSON()
    }
  }


})



module.exports = Packet;
