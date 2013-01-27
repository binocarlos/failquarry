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

var utils = require('../utils');
var _ = require('underscore');
var async = require('async');
var eyes = require('eyes');
var selectorParser = require('../container/selector');
var packetFactory = require('../packet');

module.exports = factory;

/*
  Quarry.io Warehouse Reducer
  ---------------------------

  Knows how to take a supply chain end-point (one that answers a single selector)
  and return a supply chain that can reduce an entire contract

  You can optionally pass a router function - each step is routed via this function
  if given - this gives the option to grid the whole contract

  It's job is to basically take a contract message and split it into smaller
  messages - each of which are sent via the router

 */

function compile_selector_packet(main_packet){
  var mergePacket = packetFactory();
  var phases = selectorParser(main_packet.req.body());

  _.each(phases, function(phase){
    var pipePacket = packetFactory();

    // the input for the pipe
    pipePacket.req.param('input', main_packet.req.param('input'));

    _.each(phase, function(selector, select_index){

      var selectPacket = packetFactory();
      selectPacket.protocol('quarry');
      selectPacket.path('/select');
      selectPacket.req.body(selector);
      
      if(main_packet.req.header('fields')=='skeleton' || select_index < phase.length-1){
        selectPacket.req.header('fields', 'skeleton');  
      }
      
      pipePacket.pipe(selectPacket);
    })


    mergePacket.merge(pipePacket);
  })

  return mergePacket;
} 

function factory(warehouse){

  
  function pipe(main_packet){


    var input = main_packet.req.param('input');


    // we end the branch right here with no results
    if(!input || input.length<=0){
      main_packet.res.send([]);
      return;
    }

    if(!main_packet.req.body()){
      main_packet.res.send([]);
      return; 
    }

    var raw_packets = main_packet.req.body() || [];

    var packets = _.map(raw_packets, function(raw_packet){
      var packet = packetFactory(raw_packet);

      if(main_packet.req.header('fields')=='skeleton'){
        packet.req.header('fields', 'skeleton');
      }

      return packet;
    })
    
    var current_results = input;

    async.forEachSeries(packets, function(packet, next_packet){
      packet.req.param('input', current_results);

      warehouse.run(packet, function(answer_packet){

        current_results = answer_packet.res.body();

        if(!current_results || current_results.length<=0){
          main_packet.res.send([]);
          return;
        }

        next_packet();
      })
    }, function(){
      main_packet.res.send(current_results);
    })
  }

  function merge(main_packet){

    if(!main_packet.req.body()){
      main_packet.res.send([]);
      return; 
    }

    var raw_packets = main_packet.req.body() || [];

    var packets = _.map(raw_packets, function(raw_packet){
      var packet = packetFactory(raw_packet);

      if(main_packet.req.header('fields')=='skeleton'){
        packet.req.header('fields', 'skeleton');
      }

      return packet;
    })

    var all_results = [];
    
    async.forEach(packets, function(packet, next_packet){

      warehouse.run(packet, function(answer_packet){

        var current_results = answer_packet.res.body();

        if(current_results && current_results.length>0){
          all_results = all_results.concat(current_results);
        }

        next_packet();
      })
    }, function(){
      main_packet.res.send(all_results);
    })
  }

  
  function branch(packet){

    var input = packet.req.param('input');

    // we end the branch right here with no results
    if(!input || input.length<=0){
      packet.res.send([]);
      return;
    }

    /*
      We analuse the input to create a list of branched packed
      which we then merge

     */
    var urls = {};
    var routes = {};

    _.each(input, function(raw){
      var route = raw._route || {};

      var url = route.protocol + '://' + route.hostname + '/' + route.resource;

      urls[url] || (urls[url] = []);
      urls[url].push(raw);
      routes[url] = route;
    })

    var packets = packet.req.body();
    var next_packet_raw = packets.shift();

    var next_packet = packetFactory(next_packet_raw);

    var skeleton_mode = packet.req.header('fields')=='skeleton' || packets.length>0;

    if(skeleton_mode){
      next_packet.req.header('fields', 'skeleton');
    }
    
    console.log('-------------------------------------------');
    console.log('branching');
    var all_results = [];

    // run the branch selects in parallel
    async.forEach(_.keys(urls), function(url, done){
      var input = urls[url];

      console.log('-------------------------------------------');
      console.log(url);

      // run the actual branch packet with the input
      var branch_packet = next_packet.clone();
      var main_packet = packet.clone();

      var route = routes[url];

      branch_packet.route(route);

      branch_packet.req.param('input', input);

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('branch packet');
      eyes.inspect(branch_packet.toJSON());

      warehouse.run(branch_packet, function(branch_packet_results){

        console.log('-------------------------------------------');
        console.log('branch results');
        eyes.inspect(branch_packet_results);
        function found_final_results(results){
          if(_.isArray(results.res.body())){
            all_results = all_results.concat(results.res.body());
          }
          else{
            all_results.push(results.res.body())
          }

          done();
        }

        // now we have the results from that branch
        // do we have more work to do?
        if(packets.length>0){
          main_packet.req.param('input', branch_packet_results.res.body());

          // this is the recusrion for the next step but branched
          warehouse.run(main_packet, found_final_results);
        }
        else{
          // this means we are done reducing the branch 
          found_final_results(branch_packet_results);
        }
      })


    }, function(){
      packet.res.send(all_results);
    })
  }

  var api = {
    branch:branch,
    pipe:pipe,
    merge:merge
  }


  function supply_chain(packet, next){

    var match = packet.path().match(/^\/contract\/(\w+)/);

    if(!match){
      next();
    }
    else{
      var method = match[1];

      if(!api[method]){
        next();
        return;
      }

      api[method](packet);
    }
  }

  supply_chain.compile_selector_packet = compile_selector_packet;

  return supply_chain;

}