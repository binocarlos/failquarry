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
var utils = require('./utils');
var eyes = require('eyes');
var nested = require('../vendor/backbonedeep');
var Route = require('./route');

/*
  Quarry.io - Packet
  ------------------

  A packet is an RPC instruction

  It has req & res (request, response)

 


 */

// base class for req and res
var PacketPart = nested.extend({

  getHeader:function(name){
    var headers = this.get('headers') || {};
    return headers[name];
  },

  setHeader:function(name, value){
    var headers = this.get('headers') || {};
    headers[name] = value;
    this.set('headers', headers);
    return this;
  }

})

var Req = PacketPart.extend({
  getParam:function(name){
    var params = this.get('params') || {};
    return params[name];
  },

  setParam:function(name, value){
    var params = this.get('params') || {};
    params[name] = value;
    this.set('params', params);
    return this;
  }
})

var Res = nested.extend({

  send:function(body){
    this.trigger('send', body);
  }

})

var Packet = nested.extend({

  initialize:function(){
    this.req = new Req(this.get('req'));
    this.res = new Req(this.get('res'));
    this.route = new Route(this.get('route'));
  },

  toJSON:function(){
    return {
      req:this.req.toJSON(),
      res:this.res.toJSON(),
      route:this.route.toJSON()
    }
  }


})



module.exports = Packet;
