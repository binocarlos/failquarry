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

var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var utils = require('../utils');
var eyes = require('eyes');
var dye = require('dye');
var Contract = require('../contract');

/*
  Quarry.io - Event Resolver
  -----------------------------

  Takes a meta of a container events and sends them off to the switchboard




 */

module.exports = factory;

function factory(eventtype, req, res){

  var handlers = {

    /*
    
      the branch event handler

      this creates a new request that is a GET with the remaining selector tree to pass on

      It is linked to the bayid that the parent contract is resolving in
      
    */
    branch:function(obj, config){

      if(!req.switchboard){
        return;
      }

      var bayid = req.getHeader('x-quarry-bayid');
      var resolveid = req.getHeader('x-quarry-resolveid');
      var newid = utils.littleid();

      var newreq = Contract.request({
        method:'get',
        url:config.data.url
      })

      /*
      
        put in user and department
        
      */
      req.inject(newreq);
      req.emit('bootstrap', newreq);

      /*
      
        now the selectors and new stamp id
        
      */
      newreq.setHeader('x-json-selectors', obj.selector);
      newreq.setHeader('x-quarry-bayid', bayid);
      newreq.setHeader('x-quarry-resolveid', newid);
      newreq.setHeader('x-quarry-supplier', config.data.supplier);

      /*
      
        tell the response that we branched (so if the RPC arrives before the
        switchboard the reception dosn't reply early)
        
      */
      var branches = res.getHeader('x-json-branches') || [];
      branches.push(newid);
      res.setHeader('x-json-branches', branches);

      /*
      
        broadcast the branch event
        
      */
      newreq.switchboard.broadcast('holdingbay.' + bayid, {
        action:'branch',
        requestid:resolveid,
        newid:newid,
        request:newreq.toJSON()
      })
    }
  }

  function resolve(obj){
    var meta = obj.meta || {};
    if(meta.events && meta.events[eventtype]){
      _.each(meta.events[eventtype], function(config){
        if(handlers[config.type]){
          handlers[config.type](obj, config);
        }
      })
    }  
  }

  _.extend(resolve, EventEmitter.prototype);
  
  return resolve;
}