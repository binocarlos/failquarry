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