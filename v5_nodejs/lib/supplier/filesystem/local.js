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