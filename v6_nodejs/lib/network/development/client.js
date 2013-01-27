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
var utils = require('../../utils');
var eyes = require('eyes');
var singleton = require('./singleton');
var Base = require('../client');
var queries = require('../../query/factory');

module.exports = Base.extend({
  /*
    Produce a supply chain that points to a given node
   */
  rpc:function(path){

    var self = this;

    return function(req, res, next){

      var server = singleton.rpc(self.get('stack_id'), path);

      if(!server){
        res.send404();
        return;
      }

      server.handle(req, res, next);
    }
    
    
  },

  /*
  
    here we fake it by always parsing the packet into a request
    
  */
  raw:function(path){

    var self = this;

    return function(packet, callback){

      var req = queries.fromJSON(JSON.parse(packet));
      var res = queries.response(function(res){
        callback(null, JSON.stringify(res.toJSON()));
      })
      var next = function(){
        res.send404();
      }

      var server = singleton.rpc(self.get('stack_id'), path);

      if(!server){
        res.send404();
        return;
      }

      server.handle(req, res, next);
    }
  }
})