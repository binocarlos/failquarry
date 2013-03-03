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
var RawSupplier = require('../ram/raw');
var mime = require('mime');
/*
  Quarry.io - File Supplier
  ------------------------

  Wrapper to a raw supplier backed by a file (XML/JSON)


 */
function objDataFactory(basefolder, tagname, filepath){

  var filepath = filepath.replace(basefolder, '');

  var data = {
    meta:{
      tagname:tagname,
      id:filepath,
      classnames:[]
    },
    attr:{
      type:tagname,
      path:filepath
    },
    children:[]
  }

  if(tagname!='folder'){
    var mimeType = mime.lookup(filepath);
    var parts = mimeType.split('/');

    var ext = filepath.split('.').pop();
    data.attr.mime = mimeType;
    data.attr.ext = ext;

    _.each(parts, function(part){
      data.meta.classnames.push(part);
    })

    data.meta.classnames.push('file');
  }
  else{
    data.meta.classnames.push('directory');
    data.meta.classnames.push('folder');
  }

  return data;
}


function load_file_data(directory, callback){

  fs.stat(directory, function(error, stat){
    if(error){
      callback(error);
      return;
    }

    var execFile = require('child_process').execFile;

    execFile('find', [ directory ], function(err, stdout, stderr) {
      var file_list = stdout.split('\n');

      var objs = {};
      var root_objs = [];

      _.each(file_list, function(filepath){

        if(filepath==directory){
          return;
        }

        // it is a file (we assume for haxoring sake)
        var tagname = filepath.match(/\.\w{3,4}$/) ? 'file' : 'folder';

        var obj = objDataFactory(directory, tagname, filepath);

        objs[filepath] = obj;
        
      })

      _.each(objs, function(obj, filepath){
        var parts = filepath.split('/');

        var last = parts.pop();
        var parent_path = parts.join('/');
        var parent_obj = objs[parent_path];

        if(parent_obj){
          parent_obj.children.push(obj);
        }
        else{
          root_objs.push(obj);
        }
      })

      callback(null, root_objs);
    })
  })
}

var DirectorySupplier = module.exports = RawSupplier.extend({

  prepare:function(ready){
    var self = this;

    var localfiles = this.get('deployment.network.resources.localfiles') || '';

    var path = this.get('path');

    this.directory = localfiles + this.get('directory');
    // the path to the data file
    this.folder = this.get('path').replace(/\//g, '');
        
    this.fullpath = this.directory + '/' + this.folder;

    // load the data in the file
    this.load_files(function(error, data){
      if(error){
        ready(error);
        return;
      }

      self.set({
        data:data
      })

      RawSupplier.prototype.prepare.apply(self, [ready])
    })

  },

  load_files:function(ready){
    var self = this;
    if(!this.fullpath){
      ready('no folder');
      return;
    }

    load_file_data(this.fullpath, function(error, data){
      if(!data){
        data = [];
      }

      ready(error, data);      
    })
  }

})