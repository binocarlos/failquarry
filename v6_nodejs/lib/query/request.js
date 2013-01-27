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
var BackboneDeep = require('../vendor/backbonedeep');
var eyes = require('eyes');
var url = require('url');
var utils = require('../utils');
var selectorParser = require('./selector');

/*
  Quarry.io - Request
  -------------------

  Generic request object - they map onto HTTP requests nicely but can be sent down ZeroMQ

  

 */


/*

  Create a new request object from the raw data
  This is the deserlization step

  /xml/123:456?selector=city.green



  HTTP REST -> QUARRY methods:           

    GET       SELECT
    POST      APPEND
    PUT       SAVE
    DELETE    DELETE

  method: GET|POST|PUT|DELETE

  route:              string or parsed object
    hostname
    path
  
  params            object either from body or querystring
  headers           object from HTTP
  body              raw content of update



  // run a selector and get the content-length as a count of containers in the results
  // used for paging
  {
    method:'head',
    route:{
      hostname:'quarry.io',
      path:'/db/quarry/bob/db1/123:456'
    },
    params:{
      selector:'product.cheap'
    },
    headers:{
      content-type:'application/json',
      user:{...}
    },
    body:null
  }

  // run a selector against two containers (123 & 456) inside of /db/quarry/bob/db1
  {
    method:'get',
    route:{
      hostname:'quarry.io',
      path:'/db/quarry/bob/db1/123:456'
    },
    params:{
      selector:'product.cheap'
    },
    headers:{
      content-type:'application/json',
      user:{...}
    },
    body:null
  }

  // append some containers to an existing container inside a database
  {
    method:'post',
    route:{
      hostname:'quarry.io',
      path:'/db/quarry/bob/db1/123'
    },    
    headers:{
      content-type:'application/json',
      user:{...}
    },
    body:{
      // raw containers
    }
  }

  // save one containers data
  {
    method:'put',
    route:{
      hostname:'quarry.io',
      path:'/db/quarry/bob/db1/123'
    },    
    headers:{
      content-type:'application/json',
      user:{...}
    },
    body:{
      // raw container data
    }
  }

  // delete two containers
  {
    method:'delete',
    route:{
      hostname:'quarry.io',
      path:'/db/quarry/bob/db1/123:456'
    },    
    headers:{
      content-type:'application/json',
      user:{...}
    },
    body:null
  }

 */

var Request = module.exports = BackboneDeep.extend({
  initialize:function(forceid){
    var self = this;
    if(!this.quarryid()){
      this.quarryid(utils.quarryid());
    }

    // unpack the json headers
    _.each(_.keys(this.headers()), function(name){
      if(name.match(/-JSON$/)){
        var value = self.header(name);
        if(_.isString(value)){
          self.header(name, JSON.parse(value));
        }
      }
    })
   
  },

  clone:function(){
    var ret = new Request(JSON.parse(JSON.stringify(this.toJSON())));
    ret.refreshid();
    return ret;
  },

  refreshid:function(){
    this.quarryid(utils.quarryid());
  },

  bootstrap:function(config){
    this._bootstrap = config;
    _.extend(this, config);
  },

  toJSON:function(){
    var ret = _.clone(this.attributes);
    
    return ret;
  },

 

  /*


    Contract Methods


   */

  getRequestData:function(){
    return _.map(this.requests, function(req){
      return req.toJSON();
    })
  },

  redirect:function(){

  },

  branch:function(){

  },

  broadcast:function(){

  },

  debug:function(){
    
  },

  /*


    Data Methods
    

   */
  contentType:utils.object_property_accessor('headers', 'Content-Type'),

  quarryid:utils.object_property_accessor('headers', 'X-QUARRY-REQUEST-ID'),
  transactionid:utils.object_property_accessor('headers', 'X-QUARRY-TRANSACTION-ID'),  
  routermode:utils.object_property_accessor('headers', 'X-QUARRY-ROUTER-MODE'),
  skeletonmethod:utils.object_property_accessor('headers', 'X-QUARRY-SKELETON-METHOD'),
  intended_path:utils.object_property_accessor('headers', 'X-QUARRY-INTENDED-PATH'),
  user:utils.object_property_accessor('headers', 'X-QUARRY-USER'),
  bayid:utils.object_property_accessor('headers', 'X-QUARRY-BAY-ID'),
  ticketid:utils.object_property_accessor('headers', 'X-QUARRY-TICKET-ID'),
  debugmode:utils.object_property_accessor('headers', 'X-QUARRY-DEBUGMODE'),

  /*
    object level access


    this.header('field', val);
    return this.param('field');
   */
  header:utils.object_accessor('headers'),
  param:utils.object_accessor('params'),

  jsonheader:function(name, value){
    name = name + '-JSON';
    return this.header(name, value);
  },

  selectors:function(){
    var args = _.toArray(arguments);
    args.unshift('X-QUARRY-SELECTORS');
    return this.jsonheader.apply(this, args) || [];
  },

  selector:function(){
    var args = _.toArray(arguments);
    args.unshift('X-QUARRY-SELECTOR');
    return this.jsonheader.apply(this, args) || {};
  },  

  hasSelectors:function(){
    return (this.selectors() || []).length>0;
  },

  hasSelector:function(){
    return _.keys(this.selector() || {}).length>0;
  },

  hasSkeleton:function(){
    return this.skeleton().length>0;
  },

  traceroute:function(){
    var args = _.toArray(arguments);
    args.unshift('X-QUARRY-TRACEROUTE');
    return this.jsonheader.apply(this, args) || [];
  },

  skeleton:function(){
    var args = _.toArray(arguments)
    args.unshift('X-QUARRY-SKELETON');
    return this.jsonheader.apply(this, args) || [];
  },

  skeletonquery:function(){
    var args = _.toArray(arguments)
    args.unshift('X-QUARRY-SKELETON-QUERY');
    return this.jsonheader.apply(this, args) || [];
  },

  /*

    property level access
    get the whole object

   */
  headers:utils.property_accessor('headers', {}),
  params:utils.property_accessor('params', {}),
  body:utils.property_accessor('body'),

  /*

    top level properties

   */
  method:utils.property_accessor('method', 'get'),
  hostname:utils.property_accessor('hostname'),
  path:utils.property_accessor('path', '/'),

  
  unroute:function(){
    var trace = this.traceroute();
    var path = trace.pop();
    this.traceroute(trace);
    this.path(path);
    return this;
  },
  pushroute:function(newroute){
    var trace = this.traceroute();

    if(newroute==this.path()){
      return;
    }

    if(trace.length<=0 || trace[trace.length-1]!=this.path()){
      trace.push(this.path());
      this.traceroute(trace);
    }
    
    this.path(newroute);
    return this;
  },

  resetroute:function(mode, newroute){
    if(!newroute){
      return this;
    }
    var trace = this.traceroute();
    trace.push(mode);
    trace.push(newroute);
    this.traceroute(trace);
    this.path(newroute);
    return this;
  },

  /*

    Tells the request it has been matched and that chunk
    should be removed from the path

   */
  matchroute:function(match){
    if(_.isEmpty(match)){
      return;
    }

    var newpath = this.path().substr(match.length);
    this.pushroute(_.isEmpty(newpath) ? '/' : newpath);

    return this;
  },



  originalPath:function(){
    var trace = this.traceroute();

    var resetPaths = {
      ':reception':true,
      ':reroute':true
    }

    var last_path = null;

    _.find(([]).concat(trace).reverse(), function(check){
      if(resetPaths[check]){
        return true;
      }
      last_path = check;
    })

    return last_path || this.path();
  },

  lastPath:function(){
    var trace = this.traceroute();

    return trace && trace.length>0 ? trace[trace.length-1] : this.path();
  },

  copyinto:function(req){
    //req.traceroute(this.traceroute());

    req.transactionid(this.transactionid());
    req.routermode(this.routermode());

    req.bayid(this.bayid());
    req.ticketid(this.ticketid());
    req.debugmode(this.debugmode());

    _.extend(req, this._bootstrap || {});

    return req;
  },

  stampResponse:function(res){
    res.requestid(this.quarryid());
    res.transactionid(this.transactionid());
    res.traceroute(this.traceroute());
    res.routermode(this.routermode());

    res.bayid(this.bayid());
    res.ticketid(this.ticketid());

    return res;
  },

  /*
  
    Just changes the route wholesale

   */
  reroute:function(path){
    this.resetroute(':reroute', path);
    return this;
  },

  /*
  
    turns a container routing object into the
    route we should use for this request
    
  */
  container_route:function(routes){

  },

  summary:function(){
    return {
      method:this.method(),
      path:this.path(),
      headers:this.headers()
    }
  }


})
