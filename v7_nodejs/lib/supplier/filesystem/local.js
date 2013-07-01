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

var utils = require('../../utils')
  , eyes = require('eyes')
  , _ = require('lodash');

var Container = require('../../container');
var Warehouse = require('../../warehouse');
var async = require('async');
var wrench = require('wrench');
var fs = require('fs');
var mime = require('mime');

var ContainerSupplier = require('../container');

/*
  Quarry.io - Filesystem Local Supplier
  -------------------------------------

  local directories (like source code)


 */


function objDataFactory(basefolder, filepath, stat){

  var tagname = stat.isDirectory() ? 'folder' : 'file';

  var icon = null;
  if(filepath.match(/\.(gif|png|jpg)/)){
    icon = filepath;
  }

  var parts = filepath.split('/');
  var title = parts.pop();
  var path = parts.join('/');

  var id = filepath;

  var data = {
    meta:{
      tagname:tagname,
      id:id,
      classnames:[tagname],
      icon:icon,
      quarryid:id
    },
    attr:{
      name:title,
      path:path
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
  }

  return data;
}

function load(options, url, callback){

  var filepath = options.location + url;

  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  eyes.inspect(filepath);
  fs.stat(filepath, function(error, stat){

    if(error){
      callback(error);
      return;
    }

    if(stat.isDirectory()){
      var arr = [];
      fs.readdir(filepath, function(error, filelist){
        async.forEach(filelist, function(file, nextfile){
          var singlefile = (filepath + '/' + file).replace(/\/\//g, '/');

          fs.stat(singlefile, function(error, singlestat){

            if(error || !singlestat){
              nextfile();
              return;
            }
            arr.push(objDataFactory(options.location + url, file, singlestat));
            nextfile();
          })
        }, function(error){
          callback(null, arr);
        })
        
      })

    }
    else{
      var file = objDataFactory(options.location, url, stat);

      fs.readFile(filepath, 'base64', function(error, base64){
        file.attr.base64 = base64;
        callback(null, [file]);
      })
      
    }

  })
}

module.exports = function(options, network){

  var warehouse = Warehouse();
  var location = options.location;

  var supplier = ContainerSupplier(options);

  supplier.stampwrapper({
    type:'quarry/files'
  })
  supplier.portalwrapper();

  supplier.getwrapper(function(req, res, next){

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('GET WRAPPER');
    eyes.inspect(req.toJSON());
    var skeleton = req.getHeader('x-json-skeleton') || [];
    var meta = skeleton[0];

    var url = '/';
    if(meta.tagname=='supplychain' || meta.supplychainroot){
      url = '/';
    }
    else{
      url = '/' + meta.quarryid;
    }

    load(options, url, function(error, data){
      if(error || !data){
        res.send404();
        return;
      }
      res.send(data);
    })
  })

  return supplier;
}