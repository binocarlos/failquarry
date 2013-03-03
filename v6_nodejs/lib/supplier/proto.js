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
var utils = require('../utils');
var BackboneDeep = require('../vendor/backbonedeep');
var eyes = require('eyes');

/*
  Quarry.io - Supplier
  ------------------------

  


 */

var BaseSupplier = module.exports = BackboneDeep.extend({

  initialize:function(){

  },

  prepare:function(ready){
    ready && ready(null, this);
  },

  handle:function(req, res, next){
    var self = this;
    this.emit('request:before', req);
    
    res.on('send', function(){
      self.emit('request:after', req);
    })

    this.router(req, res, function(){
      next ? next() : res.send404();
    })
  },

  router:function(req, res, next){
    next && next();
  },

  /*
  
    return the route to this supplier
    
  */
  get_stamp:function(id){
    var base = this.get('deployment.allocation_id') ? this.get('deployment.allocation_id') + this.get('path') : '/';

    return base + (id ? '/' + id : '');
  },

  get_frequency:function(id){
    var stamp = this.get_stamp(id);

    return stamp.replace(/^\//, '').replace(/\//g, '.');
  }
})