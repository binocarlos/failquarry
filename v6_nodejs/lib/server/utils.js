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
var fs = require('fs');
var mime = require('mime');
var eyes = require('eyes');
var utils = {};

module.exports = utils;


/*
 
  Scan a local folder and return a tree with it's structure
 */

utils.scanfolder = function(options, callback){

  options || (options = {});

  var directory = options.path;
  var include_mimetype = options.include_mimetype;

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
        var type = filepath.match(/\.\w{1,4}$/) ? 'file' : 'folder';

        var obj = {
          type:type,
          directory:directory,

          fullpath:filepath,
          path:filepath.substr(directory.length)
        }

        if(type=='file'){
          obj.filename = filepath.split(/\//).pop();
          obj.foldername = obj.path.replace(/\/[^\/]*$/, '') || '/';
          obj.ext = obj.filename.split('.').pop();
          obj.classnames = ['file'];
          if(include_mimetype){
            var mimeType = mime.lookup(filepath);
            var parts = mimeType.split('/');

            obj.mime = mimeType;  
            obj.classnames = obj.classnames.concat(mimeType.split('/'));
          }
        }
        else{
          obj.classnames = ['directory', 'folder'];
          obj._children = [];
        }

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

utils.banner = function(text){
  if(!text){
    return;
  }
  console.log('');
  console.log('##############################################'.cyan);
  console.log('#'.cyan + ' ' + text.white);
  console.log('##############################################'.cyan);
  console.log('');
}

utils.logger = function(config){
  this.logevent(config.text, config.depth, config.color);
  if(config.data){
    console.log('-------------------------------------------'.grey);
    console.log(JSON.stringify(config.data, null, 4).grey);
    console.log('-------------------------------------------'.grey);
    console.log('');
  }
}

utils.logevent = function(text, depth, color){
  if(!text){
    return;
  }

  if(!color){
    color = 'yellow';
  }

  var prepend = '';
  for(var i=0; i<depth; i++){
    prepend += '    ';
  }
  
  console.log((prepend + '**********************************************')[color]);
  console.log((prepend + '*')[color] + ' ' + text.white);
  console.log('');
  
}

utils.logerror = function(text){
  if(!text){
    return;
  }
  
  console.log('**********************************************'.red);
  console.log('*'.red + ' ' + text.white);
  console.log('');
  
}