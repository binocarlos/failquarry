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
    Response = require('../../../query/response'),
    eyes = require('eyes'),
    Container = require('../../../container'),
    treeEncoder = require('../tree_encoders/rationalnestedset'),
    bigint = require('bigint'),
    tools = require('./tools'),
    utils = require('../../../utils'),
    async = require('async');
    
var stare = eyes.inspector({maxLength:409600});    
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
    id:utils.quarryid(),
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
      'meta.links.parent_id':null
    },
    map:function(){
      var links = this.meta.links || [];
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

    getNextRootPosition(mongo_client, function(error, next_root_position){

      var newLink = createLink();
      newLink.position = next_root_position;
      newLink.position_array = [next_root_position];

      assignEncodingsToLink(newLink, function(error){

        container_links.push(newLink);

        container.meta('links', container_links);

        saveContainer(mongo_client, container, function(){

          async.forEach(container.children().containers(), function(child_container, next){
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
      new_link.parent_link_id = parent_link.id;
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
          async.forEach(container.children().containers(), function(child_container, next){
            cascadeInsertLinks(mongo_client, child_container, container, next);
          }, callback);
        })
      })
    })      
  }
}

var append = module.exports = function(req, res, next){

  var self = this;

  var mongo_client = this.mongoclient;

  var append_data = req.body();

  var skeleton_array = req.skeleton();

  var original_ids = _.map(req.body(), function(raw){
    return raw.meta ? raw.meta.quarryid : null;
  })

  async.forEach(skeleton_array, function(singleskeleton, next_parent){

    var target_id = singleskeleton.id;

    var results = [];

    var skeletonres = new Response();
    skeletonres.skeletonid(singleskeleton.routed ? singleskeleton.routed_id : singleskeleton.id);

    function run_append(parent_container){

      var results = [];

      async.forEachSeries(append_data, function(append_raw, next_append){
        

        var append_container = Container.new(append_raw);
        append_container.ensureids(true);

        cascadeInsertLinks(mongo_client, append_container, parent_container, function(error){

          if(!error){
            results = results.concat(append_container.toJSON());  
          }
          
          next_append(error);

        })

      }, function(error){
        if(error){
          skeletonres.error(error);
        }
        else{
          var result = {
            action:'append',
            target:target_id,
            original_ids:original_ids,
            data:results
          }
          var frequency = self.get_frequency(result.target);
          req.broadcast('container', frequency, result);
          result.data = self.appendmapper(result.data);
          skeletonres.body(result);
        }
        res.addMultipart(skeletonres);
        next_parent();
      })
    }

    if(target_id && !singleskeleton.warehouse){
      // first load up the parent fully
      mongo_client.find({
        "meta.quarryid":target_id
      }, function(error, results){

        if(!results || results.length<=0){
          next_parent();
        }
        else{
          run_append(Container.new(results[0]));
        }
      })
    }
    else{
      run_append();
    }
  }, function(error){

    if(error){
      res.sendError(error);
    }
    else{

      req.stampResponse(res);
      res.send();
    }
  })
  
}