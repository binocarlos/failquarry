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
var serverutils = require('../server/utils');
var Node = require('../stack/node');
var NetworkFactory = require('../network');
var Warehouse = require('../warehouse');
var io = require('../quarryio');

module.exports = Bootloader;


/*
  Quarry.io - Bootloader
  ----------------------

  Gets the code for a single node running on a single instance

  This is run on the actual instance not the master

  The user supplied code that is running inside the bootloader is wrapped
  The wrapper provides access to things like $quarry and io so the code
  can be run from anywhere on the filesystem without worrying about paths

  If the node specifies a json file for it's content then we create the
  factory inside the wrapper


  options:

    connections - a map of the stackpaths we should mount


 */

function Bootloader(options){
  options || (options = {});

  if(!options.network){
    throw new Error('bootloder needs a network');
  }

  if(!options.deployment){
    throw new Error('bootloder needs a deployment');
  }

  this.options = options;

  this.deployment = this.options.deployment;
  this.network = this.options.network;
}

Bootloader.prototype.rpc = function(callback){

  var options = this.options;

  /*

    This is the actual warehouse code

    This can be a user supplied function or an auto-loaded (like supplier)

   */
  var deployment = this.deployment;
  var network = this.network;

  var node = deployment.node();
  var allocation = deployment.allocation();
  var allocations = deployment.get('allocations');

  var warehouse = node.load();
  var middleware = null;
  
  /*
  
    lets see if it's a proper warehouse or just a middleware function
    
  */
  if(!_.isFunction(warehouse.handle)){

    /*
    
      it's not a warehouse - lets look at the signature to see if it's pure middleware
      or a warehouse mounter style function


      fn(req, res, next) = pure middleware

      fn(warehouse) = mount style
      
    */

    /*
    
      first make a warehouse because they have got given one
      
    */
    middleware = warehouse;
    warehouse = Warehouse();
  }



  if(middleware){
    /*
    
      now either mount the middleware or run the warehouse via it

      (in both cases the middleware representing the node is now mounted)
      
    */

    // this assumes pure middleware (req, res, next)
    if(middleware.length>1){
      warehouse.use(middleware);
    }
    // this assumes 'mount' style (warehouse)
    else{
      middleware(warehouse);
    }
  }

  /*


    hook up the request with access to the stack that it needs

   */

  warehouse.bootstrap_network(deployment, network);

  warehouse.prepare(function(ready_callback){

    /*

      
      Next we mount the routes the are below this point

      The main code must have called next to get to here

      This lets the user supplied code act as security or logging middleware
      before any further routes are reached


     */
    _.each(node.get('mountpaths'), function(mount){

      var allocation = allocations[mount.stackpath];

      if(!allocation){
        throw new Error('Allocation not found: ' + mount.stackpath);
      }

      var supplychain = network.rpc(mount.stackpath);

      warehouse.use(mount.mountpoint, function(req, res, next){
        req.debug({
          location:node.get('stackpath'),
          action:'warehouse_route',
          mountpoint:mount.mountpoint
        })

        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log('routing -> ' + mount.mountpoint);

        supplychain(req, res, next);

      }, {
        debug:true
      })
    })



    /*
    // hook up entry logging
    warehouse.usebefore(function(req, res, next){

      switchboard.broadcast('admin', warehouse.id, {
        action:'request',
        node_id:node.stackpath,
        request:req.toJSON()
      })

      next();
    })
    */

    process.nextTick(function(){
      ready_callback && ready_callback();  
    })
    
  })

  callback && callback(null, warehouse);
  
  return warehouse;
}