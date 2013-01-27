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
var Backbone = require('../vendor/backbone');
var eyes = require('eyes');
var supplier_factory = require('../supplier/factory');

/*
  Quarry.io - Provider
  --------------------

  


 */



module.exports = function(options){

  return function(warehouse){

    /*
    
      the cache of already built suppliers
      
    */
    var cache = {};

    warehouse.use(function(req, res, next){
    
      ensure_supplier(req, res, function(error, supplier){

        if(error){
          res.sendError(error);
          return;
        }

        supplier.handle(req, res, next);

      })
    })

    function ensure_supplier(req, res, ready){
      var path = req.path().split('/')[1];
      req.matchroute('/' + path);

      if(cache[path]){
        ready(null, cache[path]);
        return;
      }

      create_supplier(path, req, function(error, supplier){
        if(error){
          res.sendError(error);
          return;
        }
        cache[path] = supplier;
        ready(null, supplier);
      })
    }

    function create_supplier(path, req, ready){

      var supplier_options = _.clone(options);

      /*
      
        the path that entered the stack for this supplier

          /ram/files/xml/cities/12344

          '/ram/files/xml/cities' = stamp

          ''
        
      */
      
      /*
      
        deployment is set inside of warehouse->inject_deployment_to_requests
        
      */
      supplier_options.path = path;
      supplier_options.deployment = req.deployment.toJSON();

      var supplier = supplier_factory(supplier_options, function(error){
        ready(error, supplier);
      })

      return supplier;
    }

  }

}