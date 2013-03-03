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

var _ = require('underscore');
var BackboneDeep = require('../vendor/backbonedeep');
var eyes = require('eyes');
var url = require('url');
var utils = require('../utils');

/*
  Quarry.io - Response
  --------------------

  Much like request but simpler

  

 */



var Response = module.exports = BackboneDeep.extend({
  initialize:function(){
    this.sent = false;
    this._errors = [];
  },

  errors:function(val){
    return val ? this._errors = val : this._errors;
  },

  /*


    Data Methods
    

   */

  contentType:utils.object_property_accessor('headers', 'Content-Type'),

  header:utils.object_accessor('headers'),
  headers:utils.property_accessor('headers'),

  body:utils.property_accessor('body'),
  status:utils.property_accessor('status'),

  requestid:utils.object_property_accessor('headers', 'X-QUARRY-REQUEST-ID'),
  transactionid:utils.object_property_accessor('headers', 'X-QUARRY-TRANSACTION-ID'),
  skeletonid:utils.object_property_accessor('headers', 'X-QUARRY-SKELETON-ID'),
  routermode:utils.object_property_accessor('headers', 'X-QUARRY-ROUTER-MODE'),
  

  bayid:utils.object_property_accessor('headers', 'X-QUARRY-BAY-ID'),
  ticketid:utils.object_property_accessor('headers', 'X-QUARRY-TICKET-ID'),

  hasError:function(){
    return this.status()==500 || this.status()==404;
  },

  send:function(content){
    if(this.sent){
      throw new Error('This response has already been sent!')
    }
    this.sent = true;
    if(content){
      this.body(content);  
    }
    this.emit('send');
  },

  add_branch:function(branch_req){

    var branches = this.branches() || {};

    branches[branch_req.quarryid()] = true;

    this.branches(branches);

    return this;

  },

  branches:function(){
    var args = _.toArray(arguments);
    args.unshift('X-QUARRY-BRANCHES');
    return this.jsonheader.apply(this, args) || {};
  },
  /*
  
    assign the values of the response from a JSON string got from over the network
    
  */
  assign_packet:function(packet){
    this.set(JSON.parse(packet));
  },

  redirect:function(location){
    this.status(302);
    this.send(location);
  },

  error:function(content){
    this.status(500);
    this.body((this.req ? this.req.originalPath() + ': ' : '') + content);
  },

  send404:function(){
    this.status(404);
    this.send((this.req ? this.req.originalPath() + ': ' : '') + 'resource not found');
  },

  sendError:function(content){
    this.error(content);
    this.send();
  },

  multipart:function(body){
    if(arguments.length==0){
      return this.contentType()=='quarry/multipart';
    }
    this.contentType('quarry/multipart');
    this.body(body || []);
  },
  /*

    Multipart responses represent answers for transactions that have
    done a query for an array of actual models

    The ordering is important - the reception will keep the order
    of the responses the same as the containers in the transaction

    The client transaction can then filter out the errors, emit them
    and proceed to it's commit handler with the remaining 'pure' responses

   */
  addMultipart:function(res){
    var arr = this.body() || [];

    if(!_.isArray(arr)){
      arr = [arr];
    }

    // if we are already a multipart response then just add to the body
    if(res.contentType()=='quarry/multipart'){
      if(_.isArray(res.body())){
        arr = arr.concat(res.body());
      }
      else{
        arr.push(res.toJSON());
      }
    }
    else{
      arr.push(res.toJSON());
    }

    this.multipart(arr);
    return this;
  },

  multipartResponses:function(){
    return _.map(this.body(), function(raw){
      return new Response(raw);
    })
  },

  jsonheader:function(name, value){
    name = name + '-JSON';
    return this.header(name, value);
  },


  traceroute:function(){
    var args = _.toArray(arguments);
    args.unshift('X-QUARRY-TRACEROUTE');
    return this.jsonheader.apply(this, args) || [];
  }

  
})