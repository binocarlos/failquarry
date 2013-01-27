/*!
 * Jquarry: QuarryDB Supplier
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
    handy = require('../tools/handy'),
    async = require('async'),
    RegExpquote = require('regexp-quote'),
    treeEncoder = require('./encoders/rationalnestedset'),
    queryFactory = require('../query'),
    mongo = require('mongodb'),
    bigint = require('bigint'),
    Db = require('mongodb').Db,
    ObjectID = require('mongodb').ObjectID,
    Server = require('mongodb').Server;

// a singleton to hold onto the various database handles without re-opening each time
var databaseConnection = null;

var ensureDatabaseConnection = function(options, callback){

  if(databaseConnection){
    callback(null, databaseConnection);
    return;
  }

  var server = new Server(options.host, options.port, {auto_reconnect: true});
  var db = new Db(options.database, server);
  db.open(function(err){
    if(err) throw err;
    databaseConnection = db;
    callback(null, db);
  });

  db.on('close', function(){
    databaseConnection = null;
  })
  
}

var ensureCollection = function(options, callback){

  ensureDatabaseConnection(options, function(error, databaseConnection){
    if(error){
      callback(error);
      return;
    }

    databaseConnection.createCollection(options.collection, callback);
  })
}
    
var operatorFunctions = {
  "=":function(field, value){
    var ret = {};
    ret[field] = value;
    return ret;
  },
  "!=":function(field, value){
    var ret = {};
    ret[field] = {
      '$ne':value
    }
    return ret;
  },
  ">":function(field, value){
    var ret = {};
    ret[field] = {
      '$gt':parseFloat(value)
    }
    return ret;
  },
  ">=":function(field, value){
    var ret = {};
    ret[field] = {
      '$gte':parseFloat(value)
    }
    return ret;
  },
  "<":function(field, value){
    var ret = {};
    ret[field] = {
      '$lt':parseFloat(value)
    }
    return ret;
  },
  "<=":function(field, value){
    var ret = {};
    ret[field] = {
      '$lte':parseFloat(value)
    }
    return ret;
  },
  "^=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp('^' + RegExpquote(value), 'i')
    }
    return ret;
  },
  "$=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp(RegExpquote(value) + '$', 'i')
    }
    return ret;
  },
  "~=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp('\W' + RegExpquote(value) + '\W', 'i')
    }
    return ret;
  },
  "|=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp('^' + RegExpquote(value) + '-', 'i')
    }
    return ret;
  },
  "*=":function(field, value){
    var ret = {};
    ret[field] = {
      field:new RegExp(RegExpquote(value), 'i')
    }
    return ret;
  }
}

// get the Mongo Query for the link tree
var getLinkTreeQuery = function(descendentMode, dataArray){
  var orArray = [];

  _.each(dataArray, function(previousResult){
    
    if(previousResult){
      if(descendentMode){

        var links = previousResult.meta('links') ? previousResult.meta('links') : [];
        var firstLink = links[0] || {};

        orArray.push({
          '$and':[{
            '_meta.links.left':{
              '$gt':firstLink.left
            }
          },{
            '_meta.links.right':{
              '$lt':firstLink.right
            }
          }]
        })
      }
      else{
        orArray.push({
          '_meta.links.parent_id':previousResult.attr('_id')
        })
      }
    }
    
  });

  return orArray.length<=0 ? null : {
    '$or':orArray
  };
}

var getPaddedNumber = function(num){

  return '' + num + '00000000000000000000000000000000';
  
}

var getEncodingValue = function(top, bottom){

  var fixedLength = 36;

  top = bigint(getPaddedNumber(top));
  bottom = bigint(bottom);

  var answer = top.div(bottom).toString();

  while(answer.length<fixedLength){
    answer = '0' + answer;
  }

  return answer;
}

var assignEncodingsToLink = function(link, callback){
  treeEncoder(link.position_array, function(error, encodings){
    
    link.left_encodings = encodings.left;
    link.right_encodings = encodings.right;

    link.left = getEncodingValue(encodings.left.numerator, encodings.left.denominator);
    link.right = getEncodingValue(encodings.right.numerator, encodings.right.denominator);

    callback();
  })
}

var runSelector = function(rootContainer, mongoCollection, selector, previousResults, finishedCallback){

  var queryArray = [];
  var mainQuery = {};

  // these selectors override all the others (i.e. everything else gets ignored)
  if(selector.hasModifier('root')){
    mainQuery = {
      '_meta.links.parent_id':null
    }
  }
  else if(selector.has('quarryid')){
    mainQuery = {
      '_id':selector.quarryid()
    }
  }
  else{
    if(selector.isWildcard()){
      queryArray.push({
        '$where':'1==1'
      })
    }
    else {
      if(selector.has('tag')){
        queryArray.push({
          '_meta.tag':selector.tag()
        });
      }

      if(selector.has('id')){
        queryArray.push({
          '_meta.id':selector.id()
        });
      }

      if(selector.hasClassnames()){

        var classNames = selector.class();

        _.each(_.keys(selector.class()), function(className){
          var key = '_meta.classNames.' + className
          var chunk = {};
          chunk[key] = {
            '$exists':true
          };
          queryArray.push(chunk);
        })
      }

      if(selector.hasAttributes()){
        _.each(selector.attr(), function(attr){
          var field = attr.field;
          var operator = attr.operator;
          var value = attr.value;

          if(_.isEmpty(operator)){
            queryArray.push({
              field:{
                '$exists':true
              }
            });
          }
          else{
            var operatorFunction = operatorFunctions[operator];

            queryArray.push(operatorFunction(field, value));
          }
        })
      }
    }

    // are we looking within other results?
    if(previousResults){
     
      var linkTreeQuery = getLinkTreeQuery(selector.isDescendent(), previousResults);

      if(linkTreeQuery){
        queryArray.push(linkTreeQuery);  
      }
    }

    mainQuery = queryArray.length<=1 ? queryArray[0] : {
      '$and':queryArray
    }
  }

  // are we the last selector and not in skeleton mode - in which case we want all data
  var fields = selector.last() && !selector.skeletonMode ? null : {
    _meta:true
  }

  var options = {

  }

  handy.dir(mainQuery);
  
  mongoCollection.find(mainQuery, fields, options).toArray(function(error, results){

    var containerMap = {};

    var processRawResults = function(results){
      return _.map(results, function(result){
        var ret =rootContainer.factory(result._meta, result);

        containerMap[result._id.toString()] = ret;

        return ret;
      })
    }

    results = processRawResults(results);

    // do we want to load everything beneath first?
    if(selector.last() && selector.hasModifier('tree')){
      var treeQuery = getLinkTreeQuery(true, results);

      // trigger off the tree query
      mongoCollection.find(treeQuery, null, options).toArray(function(error, treeResults){

        var allResults = results.concat(processRawResults(treeResults));

        // if we are in tree mode then map the containers to their parents
        // this happens before all of the middleware assignment below
        _.each(allResults, function(treeResult){
          treeResult.data('tree', true);
          _.each(treeResult.meta('links'), function(link){
            var parent = containerMap[link.parent_id ? link._parent_id.toString() : null];

            if(parent){
              treeResult.appendTo(parent);
            }
          })
        });
        
        finishedCallback(error, allResults);
      });
    }
    else{
      finishedCallback(error, results);  
    }
    
  });

}

// turns the container attributes back into mongo data
var getRawDataFromContainer = function(container){

  // lets make a shallow copy and get rid of the _children
  var rawData = _.extend({}, container.raw());

  delete(rawData._children);

  return rawData;
}



var mapReduce = function(mongoDatabase, mapReduceOptions, callback){

  mapReduceOptions = _.extend({}, mapReduceOptions);

  var mapReduce = {
    mapreduce: options.collection, 
    out:  { inline : 1 },
    query: mapReduceOptions.query,
    map: mapReduceOptions.map ? mapReduceOptions.map.toString() : null,
    reduce: mapReduceOptions.reduce ? mapReduceOptions.reduce.toString() : null,
    finalize: mapReduceOptions.finalize ? mapReduceOptions.finalize.toString() : null
  }

  mongoDatabase.executeDbCommand(mapReduce, function(err, dbres) {

    var results = dbres.documents[0].results

    callback(err, results);
  })
}

// get the next available position index for this container
var getNextRootPosition = function(mongoDatabase, callback){
  var mapReduceOptions = {
    query:{
      '_meta.links.parent_id':null
    },
    map:function(){
      var links = this._meta.links || [];
      links.forEach(function(link){
        if(link.parent_id==null){
          emit('position', link.position);
        }
      })
    },
    reduce:function(k,v){
      var max = 0;
      v.forEach(function(vv){
        max = vv>max ? vv : max;
      })
      
      return max;
    }
  }

  mapReduce(mongoDatabase, mapReduceOptions, function(error, results){
    
    var result = results && results.length>0 ? results[0] : {
      value:0
    }

    callback(error, result.value + 1);
  })
  
}

var createLink = function(){
  return {
    _id:handy.quarryid(),
    parent_id:null,
    parent_link_id:null,
    position:null,
    next_child_position:0,
    position_array:[],
    left:0,
    right:0
  }
}

var isContainerLinked = function(checkContainer, toContainer){
  var links = checkContainer.meta('links') || [];

  for(var i in links){
    var link = links[i];
  
    if(link.parent_id==(toContainer ? toContainer.quarryid() : null)){
      return true;
    }
  }

  return false;
}

var saveContainer = function(mongoCollection, container, callback){
  var containerId = container.quarryid();

  // its an insert
  if(container.isNew()){
    console.log('INSERT CONTAINER: ' + containerId);

    mongoCollection.insert(getRawDataFromContainer(container), {
      safe:true
    }, function(error, objects){
      if(error) throw error;
      console.log('INSERTED');
      console.dir(objects);
      callback(error)
    }); 
  }
  // its an update
  else {
    console.log('UPDATE CONTAINER: ' + containerId);

    mongoCollection.update({_id: existingId}, {$set: getRawDataFromContainer(container)}, {
      safe:true
    }, function(error, objects){
      if(error) throw error;
      console.log('UPDATED');
      console.dir(objects);
      callback(error)
    });  
  }
}

// assigns the links needed to add one container to another - recursivly down the tree
var cascadeInsertLinks = function(mongoDatabase, container, parentContainer, callback){

  if(!callback){
    callback = parentContainer;
    parentContainer = null;
  }

  var containerLinks = container.links();

  if(!parentContainer){

    if(isContainerLinked(container)){
      callback();
      return;
    }
    getNextRootPosition(mongoDatabase, function(error, nextRootPosition){

      // this is the root link that points to nowhere
      var newLink = createLink();
      newLink.position = nextRootPosition;
      newLink.position_array = [nextRootPosition];

      assignEncodingsToLink(newLink, function(error){

        containerLinks.push(newLink);

        container.meta('links', containerLinks);

        console.log('running save');
        container.save(function(){
          async.forEach(container.children(), function(containerChild, next){
            cascadeInsertLinks(mongoDatabase, containerChild, container, next);
          }, callback);
        })

      })

      
    })
  }
  else{

    if(isContainerLinked(container, parentContainer)){
      callback();
      return;
    }

    async.forEach(parentContainer.links(), function(parentLink, nextLink){
      
      console.log('parent link');
      console.dir(parentLink);
      parentLink.next_child_position++;

      // we now have one link from the parent
      // time to cascade it down the child and it's descendents
      var newLink = createLink();
      newLink.parent_id = parentContainer.quarryid();
      newLink.parent_link_id = parentLink._id;
      newLink.position = parentLink.next_child_position;
      newLink.position_array = parentLink.position_array.concat([newLink.position]);

      assignEncodingsToLink(newLink, function(error){

        containerLinks.push(newLink);

        nextLink();

      });
    }, function(error){

      container.meta('links', containerLinks);

      // first we have to save the parent container
      parentContainer.save(function(){
        container.save(function(){
          async.forEach(container.children(), function(containerChild, next){
            cascadeInsertLinks(mongoDatabase, containerChild, container, next);
          }, callback);
        })
      });
    })      
  }
}



var factory = function(rootContainer, readyCallback){

  options = {
    host:rootContainer.attr('host'),
    port:rootContainer.attr('port'),
    // the collection is what is passed mainly
    collection:rootContainer.attr('collection'),
    database:rootContainer.attr('database')
  };

  // the container that holds the processed results
  // this will be used to search selectors
  var mongoDatabase = null;
  var mongoCollection = null;
  
  console.log('ENSURING CONNECTIONG TO DB');
  ensureDatabaseConnection(options, function(error, databaseConnection){
  
    mongoDatabase = databaseConnection;

    console.log('HAVE MOGNO CONNECTION');
    ensureCollection(options, function(error, collectionConnection){
  

      mongoCollection = collectionConnection;
  
      if(readyCallback){
        readyCallback(error, rootContainer);
      }
      rootContainer.emit('ready', rootContainer);
    })  
  })

  

  var initContainer = function(forContainer){

    if(forContainer.isSupplierType('quarrydb')){
      return;
    }

    forContainer.supplier({
      type:'quarrydb',
      config:{
        collection:rootContainer.attr('collection')
      }
    })

    forContainer.links = function(){
      var ret = this.meta('links');
      return ret ? ret : [];
    }

     // if this is saved - put it into Mongo
    forContainer.use('save', function(next){
      saveContainer(mongoCollection, forContainer, next);
    })
  }

  var quarryContainerFindClosure = function(startingContainer){
    return function(query, finalCallback){

      query = query.clone(startingContainer);

      if(!_.isFunction(finalCallback)){
        finalCallback = context;
        context = null;
      }

      if(!_.isArray(startingContainer)){
        startingContainer = startingContainer ? [startingContainer] : [];
      }

      var self = this;

      var resultsContainer = rootContainer.factory();

      resultsContainer.use('append', function(appendChild, next){
        rootContainer.build(appendChild, next);
      })

      var selectFunction = function(selector, previousResults, selectCallback){

        runSelector(rootContainer, mongoCollection, selector, previousResults, selectCallback);

      }

      var resultsFunction = function(error, searchResults){
        // add the raw containers onto the results container
        async.forEachSeries(searchResults, function(searchResult, next){
          resultsContainer.append(searchResult, next);
        }, function(){
          finalCallback(error, resultsContainer);  
        })
      }

      query.run(selectFunction, resultsFunction);
    }
  }

  rootContainer.registry().silent(true);

  // now we want to return the search function for this supplier
  // this will return an array of elements from the selector/context
  rootContainer.use('find', quarryContainerFindClosure())

  rootContainer.use('append', function(child, next){

    child.recurse(function(descendent){
      descendent.isNew(true);
      initContainer(descendent);  
    })

    // now insert the links for the children
    cascadeInsertLinks(mongoDatabase, child, null, function(){
      rootContainer.build(child, next);
    });

  })

  rootContainer.use('build', function(child, next){

    // go deep and tell all containers they are bound
    child.recurse(function(descendent){

      initContainer(descendent);

      // if a new container is added to this mongo one
      descendent.use('append', function(grandChild, next){

        initContainer(grandChild);
    
        // now insert the links for the children
        cascadeInsertLinks(mongoDatabase, grandChild, descendent, function(){
          
          rootContainer.build(grandChild, next);  
        });
        
      });

     

      // hook up remote searching for non-tree containers
      if(!descendent.data('tree')){

        descendent.data('remote_find', true);
        // now so we want to replace the find method to look at the database
        descendent.use('find', quarryContainerFindClosure(descendent))
      }

    })

    next();
  })

  rootContainer.use('close', function(next){
    mongoDatabase.close();
    next();
  })
  
  return rootContainer;
}

module.exports = factory;