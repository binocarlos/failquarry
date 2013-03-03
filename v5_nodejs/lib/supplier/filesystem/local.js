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

var _ = require('underscore'),
    eyes = require('eyes'),
    fs = require('fs'),
    ramFactory = require('../ram'),
    mime = require('mime'),
    wrench = require('wrench'),
    async = require('async');

module.exports = factory;

/*
  Quarry.io FileSystem local Supplier
  -----------------------------------

  RAM Supplier for a local folder

  options
  -------

  {
    
  }

 */

/*
  Create some raw container data from a file entry

 */
function objDataFactory(basefolder, tagname, filepath){

  var filepath = filepath.replace(basefolder, '');

  var attr = {
    _meta:{
      tagname:tagname,
      id:filepath,
      classnames:[]
    },
    _attr:{
      type:tagname,
      path:filepath
    },
    _children:[]
  }

  if(tagname!='folder'){
    var mimeType = mime.lookup(filepath);
    var parts = mimeType.split('/');

    attr.mime = mimeType;

    _.each(parts, function(part){
      attr._meta.classnames.push(part);
    })

    attr._meta.classnames.push('file');
  }
  else{
    attr._meta.classnames.push('directory');
    attr._meta.classnames.push('folder');
  }

  return attr;
}

function load_file_data(directory, callback){

  directory = directory.replace(/\/$/, '');

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
          parent_obj._children.push(obj);
        }
        else{
          root_objs.push(obj);
        }
      })

      callback(null, root_objs);
    })
  })
}

function factory(options){

  options || (options = {});

  var path = options.path;

  if(!path){
    throw new Error('filesystem/local supplier requires a location option');
  }

  wrench.mkdirSyncRecursive(path, 0777);

  function router(warehouse, ready_callback){

    var root_data = [];

    load_file_data(path, function(error, data){
      if(!error){
        root_data = data;
      }

      var ram = ramFactory({
        data:root_data
      })

      ram(warehouse, function(error, cache){

        ready_callback && ready_callback();

        /*
        function save_file(saved_callback){
          var xml_string = cache.root.toXML();

          fs.writeFile(path, xml_string, 'utf8', saved_callback);
        }

        
        // save the file to make sure ids are embedded
        save_file(ready_callback);

        function save_file_route(packet, next){
          save_file(function(error){
            next();
          })
        }

        warehouse.after('/append', save_file_route);
        warehouse.after('/save', save_file_route);
        warehouse.after('/delete', save_file_route);
        */
      })


    })
    
  }

  return router;
}