/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Quarry.io - Supplier
  --------------------

  Extension to warehouse that is an endpoint

  


 */


/*
  Module dependencies.
*/

var _ = require('underscore');
var async = require('async');
var Warehouse = require('../warehouse');
var selectorParser = require('../container/selector');
var packetFactory = require('../packet');
var util = require("util");
var eyes = require('eyes');

module.exports = Supplier;

/*
  Create a full on supplier warehouse with an object
  that has the methods provided by this supplier

  The warehouse looks after generic contract stuff
  The supplier looks after turning a 'selector' into a contract
 */

module.exports.factory = function(apiwrapper, config){

  // the warehouse wrapped supplier
  var supplier_warehouse = new Supplier(config);

  supplier_warehouse.wait();

  supplier_warehouse.use(function(packet, next){
    console.log('-------------------------------------------');
    console.log('suppliuer');
    eyes.inspect(packet.toJSON());
    next();
  })

  // setup the hostname insert for selects
  supplier_warehouse.before('quarry:///select', function(packet, next){
    
    packet.filter(function(body){
      if(!_.isArray(body)){
        return body;
      }

      return _.map(body, function(raw_container){
        // imprint the raw container with the supplier hostname & protocol
        // this is like the supplier 'stamp' on the container
        raw_container._meta || (raw_container._meta = {});

        if(raw_container._meta.tagname!='warehouse'){
          //raw_container._route = supplier_warehouse.route();
        }
        
        return raw_container;
      })
    })
    
    next();
    
  })

  // api is a function that accepts a config and a ready callback
  // it returns a function that accepts a warehouse to mount routes upon

  apiwrapper(supplier_warehouse, function(){

    // the supplier is now ready
    supplier_warehouse.waitover();
  })

  /*

    The select reduction

   */

  supplier_warehouse.use('quarry:///selector', function(packet, next){

    var mergePacket = supplier_warehouse.reducer.compile_selector_packet(packet);

    supplier_warehouse.run(mergePacket, function(answerPacket){
      packet.res.send(answerPacket.res.body());
    })
  })

  return supplier_warehouse;
}

function Supplier(config){
  Warehouse.apply(this, [config]);
}

util.inherits(Supplier, Warehouse);