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
var utils = require('../../utils');
var eyes = require('eyes');
var wrench = require('wrench');
var fs = require('fs');
var RawSupplier = require('./raw');

/*
  Quarry.io - File Supplier
  ------------------------

  Wrapper to a raw supplier backed by a file (XML/JSON)


 */

var FileSupplier = module.exports = RawSupplier.extend({

  prepare:function(ready){
    var self = this;

    var localfiles = this.get('deployment.network.resources.localfiles') || '';

    var path = this.get('path');

    this.directory = localfiles + this.get('directory');
    // the path to the data file
    this.file = this.get('path').replace(/\//g, '');
    this.format = this.get('format') || 'json';
    this.pretty = this.get('pretty') || false;
    this.save_delay = this.get('save_delay') || 1000;
    this.file_path = this.directory + '/' + this.file + '.' + this.format;

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('New file supplier');
    eyes.inspect(this.file_path);


    // load the data in the file
    this.load_file(function(error, data){
      if(error){
        ready(error);
        return;
      }

      self.set({
        data:data
      })

      RawSupplier.prototype.prepare.apply(self, [ready])
    })

    this.on('request:after', function(req){
      if(req.method()=='get'){
        return;
      }
      
      // save here
      this.save_file();  
    })
  },

  load_file:function(ready){
    var self = this;
    if(!this.file_path){
      ready('no file');
      return;
    }

    fs.readFile(this.file_path, 'utf8', function(error, data){
      if(!data){
        data = [];
      }

      ready(error, data);
    })
  },

  save_file:function(){

    var self = this;
    if(self._writing){
      return;
    }
    
    function get_data_string(){
      var root_container = self.cache.root;

      var data_string = '';
      if(self.format=='xml'){
        data_string = root_container.toXML();
      }
      else{
        data_string = this.pretty ? JSON.stringify(root_container.toJSON(), null, 4) : JSON.stringify(root_container.toJSON());
      }

      return data_string;
    }
    

    self._writing = true;

    setTimeout(function(){
      fs.writeFile(self.file_path, get_data_string(), 'utf8', function(error){
        if(error){
          throw new Error(error);
        }

        self._writing = false;
      })
    }, this.save_delay);

    
  }
})