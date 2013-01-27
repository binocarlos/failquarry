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
    eyes = require('eyes'),
    containerFactory = require('../../container'),
    treeEncoder = require('../tree_encoders/rationalnestedset'),
    bigint = require('bigint'),
    save_helper = require('./save'),
    utils = require('../../utils'),
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
  save_helper(mongo_client, {
    action:'save',
    message:{
      target:container.skeleton(),
      data:container.raw()
    }
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

    getNextRootPosition(mongo_client, function(error, next_root_position){

      // this is the root link that points to nowhere
      var newLink = createLink();
      newLink.position = next_root_position;
      newLink.position_array = [next_root_position];

      assignEncodingsToLink(newLink, function(error){

        container_links.push(newLink);

        container.meta('links', container_links);

        saveContainer(mongo_client, container, function(){
          async.forEach(container.children(), function(child_container, next){
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
          async.forEach(container.children(), function(child_container, next){
            cascadeInsertLinks(mongo_client, child_container, container, next);
          }, callback);
        })
      })
    })      
  }
}

function append(mongo_client, packet, callback){

  var message = packet.message;

  // the id of the container we want to save
  var target_id = _.isObject(message.target) ? message.target._meta.quarryid : message.target;
  var child_data = message.append;

  if(!_.isArray(child_data)){
    child_data = [child_data];
  }

  var results = [];

  function run_append(parent_container){
    async.forEachSeries(child_data, function(append_raw, next_append){
      var append_container = containerFactory(append_raw);
      cascadeInsertLinks(mongo_client, append_container, parent_container, next_append);
      results.push(append_container.raw());
    }, function(error){
      packet.answer = {
        ok:true,
        results:results
      }
      callback(error, packet);
    })
  }

  if(target_id){
    // first load up the parent fully
    mongo_client.find({
      "_meta.quarryid":target_id
    }, function(error, results){

      if(!results || results.length<=0){
        packet.answer = {
          ok:false,
          error:'parent container not found: ' + target_id
        }
        callback(error, packet);
      }
      else{
        run_append(containerFactory(results[0]));
      }
    })
  }
  else{
    run_append();
  }
}

// expose createModule() as the module
exports = module.exports = append;

