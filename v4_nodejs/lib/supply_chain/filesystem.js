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
    EventEmitter = require('events').EventEmitter,
    path = require('path'),
    fs = require('fs'),
    findit = require('findit'),
    mime = require('mime'),
    wrench = require('wrench'),
    eyes = require('eyes'),
    ramSupplier = require('./ram'),
    containerFactory = require('../container'),
    async = require('async');

/*
  Quarry.io File System Supplier
  -------------------

  A supplier that points to a filesystem and creates containers from the files in it

  options
  -------

  {
    file:__dirname + '/test.json'
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
      classnames:{}
    },
    type:tagname,
    path:filepath,    
    _children:[]
  }

  if(tagname!='folder'){
    var mimeType = mime.lookup(filepath);
    var parts = mimeType.split('/');

    attr.mime = mimeType;

    _.each(parts, function(part){
      attr._meta.classnames[part] = true;
    })

    attr._meta.classnames.file = true;
  }
  else{
    attr._meta.classnames.directory = true;
    attr._meta.classnames.folder = true;
  }

  return attr;
}


/**
 * we wrap a JSON supplier with the data structure
 * we build from scanning the filesystem
 */
function factory(options, ready_callback){

  options || (options = {});

  if(!options.directory){
    throw new Error('file system supplier requires a directory')
  }

  // the top level container we will search
  var ram_supply_chain = null;

  var directory = options.directory;

  if(options.autogen){
    wrench.mkdirSyncRecursive(directory, 0777);
  }

  // a wrapper for a RAM supplier that triggers a save on some actions
  var file_system = function(packet, callback){

    if(packet.action=='serve'){
      packet.answer = {
        type:'local',
        document_root:directory,
        file:packet.message.id
      }

      callback(null, packet);
    }
    else{
      // pass the message off to the RAM supplier
      ram_supply_chain(packet, function(error, res){

        callback && callback(error, res);

      })  
    }
    
   
  }

  file_system.options = options;

  load_files(directory, function(){
    
    ready_callback && ready_callback(null, file_system);
  })

  function load_files(directory, callback){

    directory = directory.replace(/\/$/, '');

    fs.stat(directory, function(error, stat){
      if(error){
        throw new Error(error);
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

        ram_supply_chain = ramSupplier(root_objs);

        callback();

        /* now you've got a list with full path file names */
      })
    })

      /*
      walk(directory, function(error, fileMap){

        var root_elems = [];

        _.each(_.keys(fileMap), function(path){
          var obj = fileMap[path];
          var parts = path.split('/');
          var end = parts.pop();
          var parent_path = parts.join('/');
          var parent = fileMap[parent_path];

          if(parent){
            parent._children.push(obj);
          }
          else {
            root_elems.push(obj);
          }
        })

        ram_supply_chain = ramSupplier(root_elems);

        callback();

      })

    */
  }

  return file_system;
}


module.exports = factory;