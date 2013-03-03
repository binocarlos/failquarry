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