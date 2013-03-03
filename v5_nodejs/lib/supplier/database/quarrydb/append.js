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
    EventEmitter = require('events').EventEmitter,
    eyes = require('eyes'),
    containerFactory = require('../../../container'),
    treeEncoder = require('../tree_encoders/rationalnestedset'),
    bigint = require('bigint'),
    tools = require('./tools'),
    utils = require('../../../utils'),
    async = require('async');
    
/*
  Quarry.io Quarrydb -> Append
  ----------------------------------

  Add some data to a place in the quarrydb tree

  options
  -------

  {
    
  }

 */

function createLink(){
  return {
    _id:utils.quarryid(),
    parent_id:null,
    parent_link_id:null,
    position:null,
    next_child_position:0,
    position_array:[],
    left:0,
    right:0
  }
}

// get the next available position index for this container
function getNextRootPosition(mongo_client, callback){
  var options = {
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

  mongo_client.mapreduce(options, function(error, results){
    
    var result = results && results.length>0 ? results[0] : {
      value:0
    }

    callback(error, result.value + 1);
  })
  
}

function isContainerLinked(checkContainer, toContainer){
  var links = checkContainer.meta('links') || [];

  for(var i in links){
    var link = links[i];
  
    if(link.parent_id==(toContainer ? toContainer.quarryid() : null)){
      return true;
    }
  }

  return false;
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

function assignEncodingsToLink(link, callback){
  treeEncoder(link.position_array, function(error, encodings){
    
    link.left_encodings = encodings.left;
    link.right_encodings = encodings.right;

    link.left = getEncodingValue(encodings.left.numerator, encodings.left.denominator);
    link.right = getEncodingValue(encodings.right.numerator, encodings.right.denominator);

    callback();
  })
}

function saveContainer(mongo_client, container, callback){  
  var data_array = container.toJSON();


  async.forEach(data_array, function(data, next){
    tools.save(mongo_client, data, next);
  }, callback);
}

// assigns the links needed to add one container to another - recursivly down the tree
function cascadeInsertLinks(mongo_client, container, parent_container, callback){

  // this is where we append to the top
  if(!callback){
    callback = parent_container;
    parent_container = null;
  }



  var container_links = container.meta('links')

  if(!container_links){
    container_links = [];
    container.meta('links', container_links);
  }

  if(!parent_container){

    if(isContainerLinked(container)){
      callback();
      return;
    }

    container.ensure_ids();

    getNextRootPosition(mongo_client, function(error, next_root_position){

      var newLink = createLink();
      newLink.position = next_root_position;
      newLink.position_array = [next_root_position];

      assignEncodingsToLink(newLink, function(error){

        container_links.push(newLink);

        container.meta('links', container_links);

        saveContainer(mongo_client, container, function(){

          async.forEach(container.childcontainers(), function(child_container, next){
            cascadeInsertLinks(mongo_client, child_container, container, next);
          }, callback);
        })

      })

      
    })
  }
  else{

    if(isContainerLinked(container, parent_container)){
      callback();
      return;
    }

    async.forEachSeries(parent_container.meta('links'), function(parent_link, next){
      
      parent_link.next_child_position++;

      // we now have one link from the parent
      // time to cascade it down the child and it's descendents
      var new_link = createLink();
      new_link.parent_id = parent_container.quarryid();
      new_link.parent_link_id = parent_link._id;
      new_link.position = parent_link.next_child_position;
      new_link.position_array = parent_link.position_array.concat([new_link.position]);

      assignEncodingsToLink(new_link, function(error){

        container_links.push(new_link);

        next();

      });
    }, function(error){

      container.meta('links', container_links);

      saveContainer(mongo_client, parent_container, function(){
        saveContainer(mongo_client, container, function(){
          async.forEach(container.childcontainers(), function(child_container, next){
            cascadeInsertLinks(mongo_client, child_container, container, next);
          }, callback);
        })
      })
    })      
  }
}

function factory(mongo_client, radio){

  function append(packet, next){

    var self = this;

    var message = packet.message;

    var skeleton = packet.req.param('input');

    var skeleton_ids = _.map(skeleton, function(raw){

      // at this point raw is the _meta
      var tagname = raw._meta && raw._meta.tagname ? raw._meta.tagname : null;
      var id = raw._meta && raw._meta.quarryid ? raw._meta.quarryid : null;

      return tagname=='warehouse' ? null : id;
    })

    var append_data = packet.req.body();

    if(!_.isArray(append_data)){
      append_data = [append_data];
    }

    var totalcount = 0;

    async.forEach(skeleton_ids, function(target_id, next_parent){

      var results = [];

      function run_append(parent_container){

        async.forEachSeries(append_data, function(append_raw, next_append){
          var append_container = containerFactory(append_raw);

          radio.broadcast({
            path:'/append',
            target:append_container.get_skeleton(),
            data:append_container.toJSON()
          })

          totalcount++;

          cascadeInsertLinks(mongo_client, append_container, parent_container, next_append);

          results.push(append_container.toJSON());
        }, next_parent);
      }

      if(target_id){
        // first load up the parent fully
        mongo_client.find({
          "_meta.quarryid":target_id
        }, function(error, results){

          if(!results || results.length<=0){
            next_parent();
          }
          else{
            run_append(containerFactory(results[0]));
          }
        })
      }
      else{
        run_append();
      }
    }, function(){
      packet.res.send({
        ok:true,
        count:totalcount
      })
    })
    
  }

  return append;
}

// expose createModule() as the module
exports = module.exports = factory;

