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
var eyes = require('eyes');
var BackboneDeep = require('../vendor/backbonedeep');
var Node = require('../stack/node');
var fs = require('fs');
/*
  Quarry.io - Deployment
  ----------------------

  This is one worker having been allocated out to a server and
  with all the settings it needs to be booted and have a network
  client to speak to the rest of it


 */


var Deployment = module.exports = BackboneDeep.extend({
  idAttribute:'allocation_id',
  initialize:function(){
    this._node = new Node(this.get('node'));
  },

  node:function(){
    return this._node;
  },

  ports:function(){
    return this.allocation().ports || {};
  },
  
  port:function(type){
    var ports = this.allocation().ports || {};
    return ports[type];
  },

  allocation:function(){
    var allocations = this.get('allocations') || {};
    return allocations[this.get('allocation_id')];
  },

  toJSON:function(){
    var ret = _.clone(this.attributes);
    ret.node = this._node.toJSON();
    return ret;
  },

  processname:function(){
    var stack = this.get('stack_id').replace(/\./g, '_');
    var allocation = this.get('allocation_id')=='/' ? 'root' : this.get('allocation_id').replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '_');

    return stack + ':' + allocation;
  },

  savepath:function(){
    
    var build_folder = this.get('network.folder').split('/').pop();

    var jsonfile =  this.get('allocation_id')=='/' ? 'root' : this.get('allocation_id').replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '.');

    var file = __dirname + '/../../builds/' + build_folder + '/' + this.get('stack_id') + '/deployments/' + jsonfile + '.json';

    return file;
  },

  save:function(){
    fs.writeFileSync(this.savepath(), JSON.stringify(this.toJSON(), null, 4), 'utf8');
  }
})