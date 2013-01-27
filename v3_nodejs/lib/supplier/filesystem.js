/*!
 * Jquarry: File System supplier
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    findit = require('findit'),
    mime = require('mime'),
    containerFactory = require('../container');


/**
 * Make an element out of 
 */
var objDataFactory = function(tag, path, stat){

  var meta = {
    tag:tag,
    id:path,
    class:{}
  }

  var attr = {
    _id:path,
    type:tag,
    path:path,
    size:stat.size,
    created:stat.ctime,
    modified:stat.mtime,
  };

  if(tag!='folder'){
    var mimeType = mime.lookup(path);
    var parts = mimeType.split('/');

    attr.mimeType = mimeType;

    _.each(parts, function(part){
      meta.class[part] = true;
    })

  }
  else{
    meta.class.directory = true;
    meta.class.folder = true;
  }

  attr._meta = meta;
  attr._children = [];
  return attr;
}

/**
 * Directory Walker - returns a standard jQuarry object tree for the RAW supplier
 */

var walk = function(location, callback){
  var finder = findit.find(location);

  // a flat object of filepath against raw data
  var objs = {};

  finder.on('directory', function (dir, stat) {
    objs[dir] = objDataFactory('folder', dir, stat);
  });

  finder.on('file', function (file, stat) {
    objs[file] = objDataFactory('file', file, stat);
  });

  finder.on('link', function (link, stat) {
    objs[link] = objDataFactory('link', link, stat);
  });

  finder.on('end', function() {
    callback(null, objs);
  });
}

/**
 * we wrap a JSON supplier with the data structure
 * we build from scanning the filesystem
 */

var factory = function(rootContainer, readyCallback){

  var directory = rootContainer.attr('directory');
  
  var setupRootContainer = function(searchContainer){
    rootContainer.registry().silent(true);

    rootContainer.use('find', function(selector, context, next){
      console.log('RUNNING ROOT FIND');
      
      searchContainer.find(selector, context, next);
    })

    
    

  }

  var rootContainerReady = function(){
    rootContainer.emit('ready', rootContainer);

    if(readyCallback){
      readyCallback(null, rootContainer);
    }
  }


  if(directory){

    directory = directory.replace(/\/$/, '');
    fs.stat(directory, function(error, stat){
      if(error){
        throw new Error(error);
      }

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
        });

        // make a new container out of the raw data given by the supplier
        var searchContainer = rootContainer.factory({
          name:rootContainer.name(),
          _children:root_elems
        });

        setupRootContainer(searchContainer);

        searchContainer.recurse(function(descendent){
          descendent.supplier({
            type:'filesystem',
            config:{
              directory:directory
            }
          })  
        })

        rootContainerReady();
        
      });
    });
  }
  else{
    throw new Error('File system supplier must have a directory');
  }

  return rootContainer;
}


module.exports = factory;