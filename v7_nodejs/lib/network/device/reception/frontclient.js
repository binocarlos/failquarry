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
var Warehouse = require('../../../warehouse');

module.exports = factory;

/*
  Quarry.io - Front Client
  ------------------------

  Connects to multiple reception servers by using a Dealer and binding onto each
  one that crops up - no need to unbind - ZeroMQ routes for us

 */

function factory(options){

  options || (options = {});
  options.name || (options.name = 'reception_back_client');

  var department = options.department;
  var switchboard = options.switchboard;
  var stackid = options.stackid;
  var dns = options.dns;
  
  var rpcclient = Device('rpc.client', {
    type:'dealer',
    direction:'connect'
  })

  var supplychain = Device('supplychain.client', {
    switchboard:switchboard,
    stackid:options.stackid,
    socket:Device('json.client', {
      socket:rpcclient
    })
  })

  supplychain.plugin = function(done){

    function addconnection(message){

      var socketaddress = message.front;

      /*
      
        this ends up as a multiple connect onto each Reception front

        the ZeroMQ router socket does the load-balancing for us
        
      */
      rpcclient.wires.socket.plugin(socketaddress);
    }
     
    dns.listen('reception', addconnection, function(message){
      // a reception server has gone away but is dosn't matter because ZeroMQ dealer
      // sockets are doing the load balancing
    })

    done();

  }

  return supplychain;
}