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
var utils = require('../utils');
var BackboneDeep = require('../vendor/backbonedeep');
var Backbone = require('../vendor/backbone');

var autoloaders = {
  reception:require('../reception'),
  supplier:require('../supplier'),
  provider:require('../provider'),
  auth:require('../auth'),
  switchboard:require('../switchboard')
}

/*
  Quarry.io - Node
  ----------------

  A node represents a single middleware function in the global
  warehouse routing tree

  A node will have a path - this is the relative mount-point to the
  parent warehouse

  A node also has a route - this is the absolute path to the reception
  warehouse and is used to stamp responses on their way out


  A node can exist in several places in different ways.

  It can be booted - this means this object represents the actual node
  running on the network.

  It can be routed - this means this object represents a supplychain
  to where this node actually runs



 */



var Node = module.exports = BackboneDeep.extend({
  
  initialize:function(){
    var stackpath = this.get('path').replace(/\/$/, '');

    stackpath = stackpath.replace(/\.\w+$/, '');
    stackpath = stackpath.replace(/\/(index|quarry)$/, '');
    stackpath = stackpath + '/';

    this.set('stackpath', stackpath);
    this.set('mountpoint', ('/' + this.get('stackpath').replace(/\/$/, '').split('/').pop() + '/').replace(/\/\/$/, '/'));
    this.mounts = _.map(this.get('mounts'), function(mountdata){
      return new Node(mountdata);
    }) || []

    this.id = this.get('stackpath');
    this.set('route', {
      hostname:this.get('stackid'),
      path:this.id
    })

    if(!this.fileloaded() && this.get('filename').match(/\.json$/)){
      try{
        this.assign_json_data(require(this.get('fullpath')))
      }
      catch(e){
        throw new Error('There was an error processing: ' + this.get('fullpath'));
      }
      
    }
  },

  assign_json_data:function(data){
    data || (data = {})
    this.set({
      fileloaded:true,
      pubsub:data.pubsub,
      switchboard:data.switchboard,
      data:data
    })
  },

  fileloaded:function(){
    return this.get('fileloaded');
  },

  is_pubsub:function(){
    return this.get('pubsub');
  },

  is_switchboard:function(){
    return this.get('switchboard');
  },

  recurse:function(fn){
    _.each(this.mounts, function(mount){
      mount.recurse(fn);
    })  
    fn(this);
  },

  // flat means turn the mounts just into an array of strings
  toJSON:function(flat){
    var ret = BackboneDeep.prototype.toJSON.call(this);
    ret.mounts = _.map(this.mounts, function(mount){
      return !flat ? mount.toJSON() : {
        mountpoint:mount.get('mountpoint'),
        stackpath:mount.get('stackpath')
      }
    })
    return ret;
  },

  mount:function(node){

    var stackpath = this.get('stackpath');
    var child_stackpath = node.get('stackpath');

    var newpath = '/' + child_stackpath.substr(stackpath.length);
    
    node.set('mountpoint', newpath);

    this.mounts.push(node);
    return this;
  },

  load_data:function(data){
  
    if(!autoloaders[data.type]){
      throw new Error(data.type + ' is not a valid autoload type');
    }

    return autoloaders[data.type].apply(null, [data]);
  },

  load_js:function(){
    var path = this.get('fullpath');

    return require(path).apply(null, []);
  },

  load_json:function(){
    return this.load_data(this.get('data'));
  },

  load_raw:function(){
    return this.load_data(this.get('raw'));
  },

  load:function(){
    if(this.get('ext')=='js'){
      return this.load_js();
    }
    else if(this.get('ext')=='json'){
      return this.load_json();
    }
    else if(this.get('ext')=='raw'){
      return this.load_raw();
    }
    else{
      return {};
    }
  }

})