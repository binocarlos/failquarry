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