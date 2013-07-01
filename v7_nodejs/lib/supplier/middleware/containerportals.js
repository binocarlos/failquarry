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
var async = require('async');
var eyes = require('eyes');
var Portal = require('../../portal/proto');
var utils = require('../../utils');

/*
  Quarry.io - Broadcast Portals
  -----------------------------

  Middleware to look after the broadcasting of events that have happened in the database

  It hooks up a beforesend handler on the response and looks at the x-json-portal-instructions
  to determine what to do

  the switchboard has been assigned to the req by the supplychain

  (otherwise we don't do anything here)

 */

module.exports = factory;

function factory(){

  return function(req, res, next){

    req.on('portal', function(instruction){
      var instructions = req.getHeader('x-json-container-portals') || [];
      instruction = _.isString(instruction) ? {
        type:instruction
      } : instruction;

      instructions.push(instruction);
      req.setHeader('x-json-container-portals', instructions);
    })

    res.on('beforesend', function(){


      var instructions = req.getHeader('x-json-container-portals') || [];
      var target = req.getHeader('x-json-skeleton')[0];

      if(instructions.length<=0 || res.hasError()){
        return;
      }

      if(!target){
        target = {
          tagname:'supplychain'
        }
      }

      target.quarrysupplier = req.getHeader('x-quarry-supplier');

      /*
      
        each instruction here is a uniquely different request
        that should be broadcast with a different id
        
      */
      _.each(instructions, function(instruction){

        instruction.id = utils.littleid();
        instruction.type = 'container';
        instruction.target = target;
        instruction.method = req.method;
        instruction.url = req.url;
        instruction.user = req.getHeader('x-json-quarry-user');
        instruction.headers = res.headers;
        instruction.body = res.body;
        
        var portal = new Portal();
        portal.attach(instruction.target, req.switchboard);
        portal.broadcastinstruction(instruction);
      })
      
    })

    next();
  }
}