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
var BackboneDeep = require('../vendor/backbonedeep');
var eyes = require('eyes');

/*
  Quarry.io - Supplier
  ------------------------

  


 */

var BaseSupplier = module.exports = BackboneDeep.extend({

  initialize:function(){

  },

  prepare:function(ready){
    ready && ready(null, this);
  },

  handle:function(req, res, next){
    var self = this;
    this.emit('request:before', req);
    
    res.on('send', function(){
      self.emit('request:after', req);
    })

    this.router(req, res, function(){
      next ? next() : res.send404();
    })
  },

  router:function(req, res, next){
    next && next();
  },

  /*
  
    return the route to this supplier
    
  */
  get_stamp:function(id){
    var base = this.get('deployment.allocation_id') ? this.get('deployment.allocation_id') + this.get('path') : '/';

    return base + (id ? '/' + id : '');
  },

  get_frequency:function(id){
    var stamp = this.get_stamp(id);

    return stamp.replace(/^\//, '').replace(/\//g, '.');
  }
})