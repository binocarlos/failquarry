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
var eyes = require('eyes');
var express = require('express');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
//var Proto = require('./proto');

module.exports = Website;

/*
 
  The mount point for the HTTP API for the whole stack
 */


function Website(options){
  var self = this;
  options || (options = {});

  this.options = options.config;
  this.network_client = options.network_client;
  this.io = options.io;

  this.app = express();
  this.app.network_client = this.network_client;

  this.app.set('options', this.options);
}

Website.prototype.__proto__ = EventEmitter.prototype;

Website.prototype.initialize = function(loaded_callback){

  var self = this;

  var base_mixin_config = {
    app:self.app,
    website_options:self.options,
    network_client:self.network_client,
    io:self.io
  }

  function run_mixin_method(method_name, callback){
    /*
      
      load and apply the mixins
      
    */
    async.forEachSeries(self.options.mixins, function(mixin_config, next_mixin){

      var mixin = require('./mixins/' + mixin_config.name);

      if(mixin[method_name]){
        console.log('-------------------------------------------');
        console.log('running ' + mixin_config.name + ' mixin: ' + method_name);

        var use_mixin_config = _.clone(base_mixin_config);

        use_mixin_config.mixin_options = mixin_config.config;

        mixin[method_name].apply(mixin, [use_mixin_config, next_mixin]);
      }
      else{
        next_mixin();
      }

    }, callback)
  }

  /*
  
    first off lets setup the serving directory and very basic stuff
    we will turn on for all websites (like bodyParser etc)
    
  */

  async.series([
    /*
    
      always apply the basic mixin
      
    */
    function(next){
      
       var mixin = require('./mixins/basic');

       mixin.configure(base_mixin_config, next);

    },

    /*
    
      run the mixin configure methods
      
    */
    function(next){

      run_mixin_method('configure', next);
      
    },

    
    /*
    
      set the document root
      
    */
    function(next){
      console.log('-------------------------------------------');
      console.log('setting document root: ' + self.document_root());
      self.app.use(express.static(self.document_root()));
      next();      
    },

    /*
    
      run the mixin route methods
      
    */
    function(next){

      run_mixin_method('route', next);

    },

    /*
    
      now apply the user middleware
      
    */
    function(next){

      fs.stat(self.middleware_root() + '/index.js', function(error, stat){
        if(error || !stat){
          next();
          return;
        }

        var middleware = require(self.middleware_root() + '/index.js')(self.options);

        middleware(self.app);

        next();
      })

    }


  ], loaded_callback)

}

Website.prototype.document_root = function(){
  return [this.options.directory, this.options.document_root].join('/');
}

Website.prototype.middleware_root = function(){
  return [this.options.directory, this.options.middleware].join('/');
}

Website.prototype.script_root = function(){
  return [this.options.directory, this.options.script].join('/');
}

Website.prototype.hostnames = function(){
  return this.options.hostnames;
}

Website.prototype.express_handler = function(){
  return this.app;
}