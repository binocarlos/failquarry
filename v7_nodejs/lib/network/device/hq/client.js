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
var util = require('util');
var utils = require('../../../utils');
var Device = require('../../device');
var deck = require('deck');
var Provider = require('../../../supplier/provider');

module.exports = factory;

/*
  Quarry.io - HQ Server
  ---------------------

  The DB for the stacks

 */

function factory(options){

  options || (options = {});
  options.name || (options.name = 'hq_server');

  var id = options.id;

  var client = Device('core.box', {
    name:options.name
  })

  var switchboard = Device('switchboard.standardclient', _.extend({
    name:'HQ Switchboard',
    stackid:'hq'
  }, options))


  var rpcclient = Device('rpc.client', {
    type:'router',
    direction:'connect',
    address:options.endpoints.rpc
  })

  var supplychain = Device('supplychain.client', {
    switchboard:switchboard,
    stackid:options.stackid,
    socket:Device('json.client', {
      socket:rpcclient
    })
  })

  supplychain.plugin = function(done){

    async.series([
      function(next){
        switchboard.plugin(next);
      },

      function(next){
        rpcclient.plugin(next);
      }

      
    ], done)
  }

  return supplychain;
}