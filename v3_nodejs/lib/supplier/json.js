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
    handy = require('../tools/handy'),
    fs = require('fs');

var loadRawData = function(rootContainer, readyCallback){
  var rawDataArray = rootContainer.attr('data') || [];

  var filePath = rootContainer.attr('file');

  var ensureFile = function(ensuredCallback){
    fs.stat(filePath, function(error, stat){
      if(error || !stat){
        fs.writeFile(filePath, '[]', function(error){
          ensuredCallback(error)
        })
      }
      else{
        ensuredCallback();
      }
    })
  }

  if(filePath){
    // try catch here

    ensureFile(function(error){
      if(error){
        throw new Error(error);
      }

      try{
        rawDataArray = require(filePath);
      }
      catch (err){
        throw new Error('Json Load Error: ' + err)
      }

      readyCallback(null, rawDataArray);
    })
    
  }
  else{
    readyCallback(null, rawDataArray);
  }
}

var extractRawDataFromContainer = function(fromContainer){
  var rootData = [];

  _.each(fromContainer.children(), function(fromContainerChild){
    var raw = fromContainerChild.raw(function(raw){
      delete(raw._data);
      return raw;
    });
    
    rootData.push(raw);
  });

  return rootData;
}

var getSaveFunction = function(rootContainer, searchContainer){

  var filePath = rootContainer.attr('file');

  // we are in file mode
  if(filePath){
    return function(savedCallback){

      var jsonData = JSON.stringify(extractRawDataFromContainer(searchContainer), null, 4);

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('running save');
      console.dir(savedCallback);
      // out
      fs.writeFile(filePath, jsonData, savedCallback);
      /*
      if(savedCallback){
        savedCallback();
      }
      */
    }
  }
  else{
    return function(savedCallback){
      if(savedCallback){
        savedCallback();
      }
    }
  }
}

var checkForNewContainers = function(inContainer){
  var hasNew = false;
  inContainer.recurse(function(descendent){
    if(descendent.isNew()){
      hasNew = true;
    }
  })
  return hasNew;
}

var getSearchContainer = function(rootContainer, containerCallback){

  var filePath = rootContainer.attr('file');

  loadRawData(rootContainer, function(error, rawData){
    // make a new container out of the raw data given by the supplier
    var searchContainer = rootContainer.factory({
      name:rootContainer.name(),
      _children:rawData
    });

    containerCallback(null, searchContainer);
  })
}

/**
 * Factory - returns a supplier object configured properly
 */

var factory = function(rootContainer, readyCallback){

  var filePath = rootContainer.attr('file');
  
  var setupRootContainer = function(searchContainer){
    rootContainer.registry().silent(true);

    rootContainer.use('append', function(child, next){
      searchContainer.append(child, next);
    })

    rootContainer.use('find', function(selector, context, next){
      searchContainer.find(selector, context, next);
    })
  }

  var rootContainerReady = function(){
    rootContainer.emit('ready', rootContainer);

    if(readyCallback){
      readyCallback(null, rootContainer);
    }
  }

  getSearchContainer(rootContainer, function(error, searchContainer){

    var saveFunction = getSaveFunction(rootContainer, searchContainer);

    var doSetup = function(){

      setupRootContainer(searchContainer);

      var setupContainer = function(forContainer){
         // map each descendents middleware
        forContainer.recurse(function(descendent){

          descendent.supplier({
            type:'json',
            config:{
              file:rootContainer.attr('file')
            }
          })

          descendent.use('save', function(next){
            saveFunction(next);
          })

          descendent.use('append', function(child, next){
            setupContainer(child);
            saveFunction(next);
          })
        })

      }

      searchContainer.use('append', function(child, next){
        setupContainer(child);
        saveFunction(next);
      })

      setupContainer(searchContainer);
      
    }

    // lets see if we have updated the ids in the file
    if(checkForNewContainers(searchContainer)){
      saveFunction(doSetup);
    }
    else{
      doSetup();
    }
  

    rootContainerReady();

  })

  return rootContainer;
}

module.exports = factory;