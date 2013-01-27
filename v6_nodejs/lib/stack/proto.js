/*
  Copyright (c) 2012 All contributors as noted in the AUTHORS file

  This file is part of quarry.io

  quarry.io is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  quarry.io is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
  Module dependencies.
*/

var _ = require('underscore');
var async = require('async');
var utils = require('../utils');
var Warehouse = require('../warehouse');
var eyes = require('eyes');
var serverutils = require('../server/utils');
var fs = require('fs');
var BackboneDeep = require('../vendor/backbonedeep');
var Backbone = require('../vendor/backbone');
var Node = require('./node');

/*
  Quarry.io - Stack
  -----------------

  Represents one warehouse installation


 */

var Stack = module.exports = BackboneDeep.extend({

  idAttribute:'hostname',

  _stack:true,

  initialize:function(){
    this.root_node = null;
    this.nodes = {};
    this.websites = {};

    var folder = this.get('folder');

    if(fs.existsSync(folder + '/config.json')){

      var stack_config = fs.readFileSync(folder + '/config.json', 'utf8');

      this.set(JSON.parse(stack_config));
    }
  },

  load:function(loaded_callback){
    var self = this;

    async.parallel([
      function(next){
        self.scanfolder(function(error, filetree){
          self.buildnodes(filetree, function(error, root_node){
            self.root_node = root_node;
            root_node.recurse(function(n){
              self.nodes[n.id] = n;
            })
            next();
          })
        })    
      },

      function(next){
        self.load_websites(next);
      }
    ], function(){
      loaded_callback(null, self);
    })
    
  },

  recurse:function(fn){
    this.root_node && this.root_node.recurse(fn);
    return this;
  },

  toJSON:function(){
    var ret = _.clone(this.attributes);
    this.root_node && ret.root_node.toJSON();
    ret.websites = this.websites;
    return ret;
  },

  buildnode:function(fileinfo){
    fileinfo.stackid = this.id;

    var node = new Node(fileinfo);

    return node;
  },

  // make a node out of the .json / .js file
  buildnodes:function(filetree, callback){
    var self = this;

    // ignore any other types of file
    var include_types = {
      js:true,
      json:true
    }

    var nodes = {};
    var root_node = null;

    function process_info(info){

      if(info.type=='folder'){
        _.each(info._children, process_info);
      }
      else if(include_types[info.ext]){
        var node = self.buildnode(info);
        nodes[node.get('stackpath')] = node;
      }
    }

    _.each(filetree, process_info);

    var root_node = nodes['/'];

    if(!root_node){
      throw new Error('warning - cannot find root node for: ' + this.id);
    }

    async.forEach(_.keys(nodes), function(path, next){
      var node = nodes[path];
      if(path=='/'){
        return;
      }
      var parent_path = path.replace(/\w+\/$/, '');
      var parent = nodes[parent_path] ? nodes[parent_path] : root_node;

      if(node.get('filename').match(/\.json$/)){
        try{
          node.set({
            data:require(node.get('fullpath'))
          })  
        }
        catch(e){
          throw new Error('There was an error processing: ' + node.get('fullpath'));
        }
        
      }

      if(parent){      
        parent.mount(node);
      }
      else{
        throw new Error('warning - cannot find parent for mount: ' + path + ' in ' + this.hostname())
      }
    })

    callback(null, root_node);
  },

  load_websites:function(callback){
    var self = this;

    var folder = this.get('folder');

    fs.readdir(folder + '/websites', function(error, list){

      async.forEachSeries(list, function(id, next){
        if(fs.existsSync(folder + '/websites/' + id + '/config.json')){
          var website_config_text = fs.readFileSync(folder + '/websites/' + id + '/config.json', 'utf8');
          var website_config = JSON.parse(website_config_text);

          website_config.directory = folder + '/websites/' + id;

          self.websites[id] = website_config;
        }

        next();

      }, callback);
      
    })
  },

  // scan the root folder for .js and .json configs for nodes
  scanfolder:function(callback){

    var self = this;

    var folder = this.get('folder');

    /*
    
      this merges in the 'default' stack - things like switchboard and reception
      
    */
    var defaultpath = __dirname + '/default';
    var stackpath = folder + '/stack';
    
    serverutils.scanfolder({
      path:stackpath
    }, function(stackerror, stackresults){

      if(stackerror){
        callback(stackerror);
        return;
      }

      serverutils.scanfolder({
        path:defaultpath
      }, function(defaulterror, defaultresults){
        if(defaulterror){
          callback(defaulterror);
          return;
        }

        var found_paths = {};

        // this is the merge - we override the defaults with the actual stack
        var allresults = (stackresults || []).concat(defaultresults);

        allresults = _.filter(allresults, function(result){
          if(found_paths[result.path]){
            return false;
          }

          if(result.path=='/stack.json'){
            return false;
          }

          found_paths[result.path] = true;
          return true;
        })

        callback(null, allresults);
      })
    })
    
  }
})