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
var async = require('async');
var utils = require('../utils');
var eyes = require('eyes');
var BaseSupplier = require('./proto');
var resolver = require('./resolver');
var Response = require('../query/response');
var selector_parser = require('../query/selector');

/*
  Quarry.io - Container Supplier
  ------------------------------

  A supplier that will load container data from selectors


 */

// a map where if the container id is one of these then the actual container
// id is one level down in the url
//
// /meta/1234

var api_methods = {
  meta:function(req, res, next){

  }
}

var ContainerSupplier = module.exports = BaseSupplier.extend({

  prepare:function(ready){
    BaseSupplier.prototype.prepare.apply(this, [ready]);
  },

  ensure_skeleton:function(req){
    var path_id = req.path()=='/' ? null : req.path().replace(/^\//, '');

    if(!req.hasSkeleton()){
      req.skeleton([{
        id:path_id ? path_id : 'warehouse'
      }])
    }
    else{
      var skeleton = req.skeleton();
      // lets see if we have an id and one skeleton
      if(path_id && skeleton.length==1){
        skeleton[0].id = path_id;
      }
    }
  },

  /*
  
    looks after mapping the GET id and/or select params
    
  */
  ensure_selector_request:function(req){
    if(!req.hasSelectors() && !req.hasSelector()){
      if(req.param('selector')){
        req.selectors([selector_parser(req.param('selector'))]);
      }
    }

    if(!req.hasSkeleton()){
      var container_id = req.path().replace(/^\//, '');

      /*
      
        there is no id - the starting point is the top
        
      */
      if(container_id.match(/\w/)){
        req.skeleton([{
          _meta:{
            quarryid:container_id
          }
        }])
      }
    }
  },


  mapSkeleton:function(skeleton){
    if(skeleton.warehouse){
      skeleton.id = 'warehouse';
    }
    return skeleton;
  },


  /*

    The entry point for ALL requests

    GET + selector + skeleton = resolver
    GET + skeleton = meta


   */
  router:function(req, res, next){

    var self = this;

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('container req');
    eyes.inspect(req.toJSON());

    if(req.method()=='get'){

      this.ensure_selector_request(req);

      // we use the resolver for selectors
      if(req.hasSelectors()){

        //eyes.inspect(req.toJSON());
        this.ensure_skeleton(req);

        resolver({
          req:req,
          res:res,
          supplychain:_.bind(self.selector, self)
        })

        return;
      }
      else if(req.hasSelector()){

        this.ensure_skeleton(req);

        this.selector(req, res, next);

        return;
      }
      // we are accessing data by id
      else if(req.hasSkeleton()){

        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log('ACCESS BY ID');
        throw new Error('no selector');
        process.exit();
      }
      else{
        console.log('-------------------------------------------');
        console.log('other');
        process.exit();
      }
    }
    else if(req.method()=='post'){
      self.appender(req, res, next);
    }
    else if(req.method()=='put'){
      self.saver(req, res, next);
    }
    else if(req.method()=='delete'){
      self.deleter(req, res, next);
    }
    else{
      throw new Error('container: ' + req.method());
      //next();
    }

    
  },

  /*

    This function controls the raw output of container suppliers


   */
  selectmapper:function(req, results){
    var self = this;
    
    return _.map(results, function(result){

      /*

        This is controlled  by the :tree modifier

       */
      if(!req.param('includechildren')){
        result.children = [];
      }

      /*
      
        the means only the skeleton to pipe into the next
        selector

        
      */
      if(!req.param('includedata')){
        result = _.extend({}, {
          id:result.meta ? result.meta.quarryid : result.id,
          routes:result.routes ? result.routes : {}
        }, result.meta ? result.meta.skeleton : {});
      }
      /*

        This means the last selector - time to stamp the data

       */
      else{

        result.routes = _.extend(result.routes, {
          stamp:self.get_stamp()
        })
      }

      return result;
    })
  },

  appendmapper:function(results){
    var self = this;
    return _.map(results, function(result){
      result.routes = _.extend(result.routes, {
        stamp:self.get_stamp()
      })
      return result;
    })
  },
  

  /*

    The supplychain for the resolver

    When requests get here they always have a single selector

    It might have multiple skeletons - it is up to the supplier how to branch
    out from here

   */
  selector:function(req, res, next){

    var self = this;

    var all_results = [];

    async.forEach(req.skeleton(), function(singleskeleton, next_skeleton){

      self.select(req.selector(), self.mapSkeleton(singleskeleton), function(error, results){
        if(!error){
          all_results = all_results.concat(results ? results : []);
          next_skeleton();
        }
        else{
          next_skeleton(error);
        }
        
      })
        
    }, function(error){

      if(error){
        res.sendError(error);
      }
      else{
        req.stampResponse(res);
        res.contentType('quarry/containers')

        var results = self.selectmapper(req, all_results);

        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log(JSON.stringify(results, null, 4));
        res.send(results);
      }
    })
  },

  select:function(selector, skeleton, callback){

  },


  /*
  
    the append process
    
  */

  appender:function(req, res, next){

    var self = this;

    var all_results = [];

    async.forEach(req.skeleton(), function(singleskeleton, next_skeleton){

      var skeletonres = new Response();

      skeletonres.skeletonid(singleskeleton.routed ? singleskeleton.routed_id : singleskeleton.id);

      self.append(req.body(), self.mapSkeleton(singleskeleton), function(error, result){

        if(!error){
          /*
          
            broadcast the append event out to the container switchboard
            
          */
          var frequency = self.get_frequency(result.target);
          req.broadcast('container', frequency, result);
          result.data = self.appendmapper(result.data);
          skeletonres.body(result);
          
        }
        else{

          skeletonres.error(error);
        }

        res.addMultipart(skeletonres);

        next_skeleton();
        
      })
        
    }, function(error){

      if(error){
        res.sendError(error);
      }
      else{

        req.stampResponse(res);
        res.send();
      }
    })
  },

  append:function(data, skeleton, callback){

  },

  saver:function(req, res, next){
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('SAVER');
    var self = this;

    var self = this;

    var all_results = [];

    async.forEach(req.body(), function(singleskeleton, next_skeleton){

      var skeletonres = new Response();

      skeletonres.skeletonid(singleskeleton.id);

      self.save(singleskeleton.data, self.mapSkeleton(singleskeleton), function(error, result){

        if(!error){
          /*
          
            broadcast the append event out to the container switchboard
            
          */
          var frequency = self.get_frequency(result.target);
          req.broadcast('container', frequency, result);
          skeletonres.body(result);
          
        }
        else{

          skeletonres.error(error);
        }

        res.addMultipart(skeletonres);

        next_skeleton();
        
      })
        
    }, function(error){

      if(error){
        res.sendError(error);
      }
      else{

        req.stampResponse(res);
        res.send();
      }
    })

    

  },

  save:function(data, skeleton, callback){

  },

  deleter:function(req, res, next){
    var self = this;

    var all_results = [];

    async.forEach(req.skeleton(), function(singleskeleton, next_skeleton){

      var skeletonres = new Response();

      skeletonres.skeletonid(singleskeleton.id);

      self.delete(self.mapSkeleton(singleskeleton), function(error, result){

        console.log('-------------------------------------------');
        console.log('after delete');

        if(!error){
          /*
          
            broadcast the append event out to the container switchboard
            
          */
          var frequency = self.get_frequency(result.target);
          req.broadcast('container', frequency, result);
          skeletonres.body(result);
        }
        else{

          skeletonres.error(error);
        }

        res.addMultipart(skeletonres);

        next_skeleton();
        
      })
        
    }, function(error){

      if(error){
        res.sendError(error);
      }
      else{

        req.stampResponse(res);
        res.send();
      }
    })
  },

  delete:function(skeleton, callback){
    
  }

})