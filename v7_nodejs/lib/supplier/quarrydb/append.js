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

var _ = require('lodash'),
    async = require('async'),
    eyes = require('eyes'),
    bigint = require('bigint');

var load_containers = require('./load_containers');
var treeEncoder = require('../tools/rationalnestedset');

var tools = require('./tools');

    /*
    EventEmitter = require('events').EventEmitter,
    Response = require('../../../query/response'),
    eyes = require('eyes'),
    Container = require('../../../container'),
    treeEncoder = require('../tree_encoders/rationalnestedset'),
    
    
    utils = require('../../../utils'),
    */
    

/*
  Quarry.io Quarrydb -> Append
  ----------------------------------

  Add some data to a place in the quarrydb tree

  options
  -------

  {
    
  }
 */


// get the next available position index for this container
function getNextRootPosition(mongoclient, callback){
  var options = {
    query:{
      'meta.parent_id':null
    },
    map:function(){
      emit('position', this.meta.rootposition);
    },
    reduce:function(k,v){
      var max = 0;
      v.forEach(function(vv){
        max = vv>max ? vv : max;
      })
      return max;
    }
  }

  /*
  
    a total hack when we are in dev mode it dosn't like 2 at the same time
    
  */
  setTimeout(function(){
    mongoclient.mapreduce(options, function(error, results){
    
      var result = results && results.length>0 ? results[0] : {
        value:0
      }

      callback(error, result.value + 1);
    })  
  }, Math.round(Math.random()*20))
}

function getPaddedNumber(num){

  return '' + num + '00000000000000000000000000000000';
  
}

function getEncodingValue(top, bottom){

  var fixedLength = 36;

  top = bigint(getPaddedNumber(top));
  bottom = bigint(bottom);

  var answer = top.div(bottom).toString();

  while(answer.length<fixedLength){
    answer = '0' + answer;
  }

  return answer;
}

function assignTreeEncodings(meta){

  var encodings = treeEncoder(meta.quarryportal);
    
  meta.left_encodings = encodings.left;
  meta.right_encodings = encodings.right;

  meta.left = getEncodingValue(encodings.left.numerator, encodings.left.denominator);
  meta.right = getEncodingValue(encodings.right.numerator, encodings.right.denominator);
}


function insertContainer(mongoclient, data, callback){  
  
  var raw = _.clone(data);
  delete(raw.children);
  delete(raw.meta.quarrysupplier);
  delete(raw.meta.data);
  delete(raw.meta.changed);
  tools.insert(mongoclient, raw, callback);

}

function updateContainer(mongoclient, data, callback){  

  var raw = _.clone(data);
  delete(raw.children);

  tools.save(mongoclient, {
    "meta.quarryid":data.meta.quarryid
  }, raw, callback);

}

// assigns the links needed to add one container to another - recursivly down the tree
function cascadeInsert(mongoclient, data, parent_data, finishedcallback){

  /*
  
    this means we are appending to the top of the database
    
  */
  if(!parent_data){

    getNextRootPosition(mongoclient, function(error, next_root_position){

      data.meta.quarryportal = [next_root_position];
      data.meta.rootposition = next_root_position;

      assignTreeEncodings(data.meta);

      insertContainer(mongoclient, data, function(error){

        async.forEach(data.children || [], function(child_data, next_child){
          
          cascadeInsert(mongoclient, child_data, data, next_child);
          
        }, function(error){

          finishedcallback(error, data);
        })

      })


    })
  }
  else{

    if(!parent_data.meta){
      throw new Error('skeleton passed as full container data');      
    }

    parent_data.meta.next_child_position || (parent_data.meta.next_child_position = 0);
    parent_data.meta.next_child_position++;
    
    data.meta.quarryportal = parent_data.meta.quarryportal.concat([parent_data.meta.next_child_position]);
    data.meta.parent_id = parent_data.meta.quarryid;

    assignTreeEncodings(data.meta);

    updateContainer(mongoclient, parent_data, function(){

      insertContainer(mongoclient, data, function(){

        async.forEach(data.children || [], function(child_data, next_child){
          cascadeInsert(mongoclient, child_data, data, next_child);
        }, function(error){

          finishedcallback(error, data);
        })

      })
    })
  }
}
 
var append = module.exports = function(mongoclient){

  return function(req, res, next){

    load_containers(mongoclient, req, res, function(error, containers){

      var self = this;

      var skeleton = containers ? containers[0] : req.getHeader('x-json-skeleton')[0];

      var parent_data = skeleton;

      var results = [];

      req.emit('debug', {
        location:'Mongo Supplier',
        action:'POST:req',
        count:(req.body || []).length
      })

      /*
      
        run through each of the appending containers and insert them into the DB
        
      */
      async.forEachSeries(req.body || [], function(data, next_data){

        cascadeInsert(mongoclient, data, parent_data, function(error){

          if(!error){
            results = results.concat(data);  
          }

          next_data(error);

        })

      }, function(error){

        if(error){
          res.error(error);
          return;
        }

        req.emit('debug', {
          location:'Mongo Supplier',
          action:'POST:res',
          data:results
        })
        /*
        
           we send the append results
          
        */
        res.containers(results).send();

        
      })

    })


  }
  
}