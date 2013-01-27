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

var StackClass = require('./stack/proto');

/*
  Quarry.io - Stack
  -----------------

  A deployment config that will run a full-warehouse stack with provider support

  The providers are booted from a folder layout and mounted as per their location

  Each provider as well as core things like router/reception will be created as a self-managed cluster

  There are 2 types of resources within a stack:

    a) global resources       general servers that are used outside selectors or container scope
    b) warehouses             that warehouse layout that can resolve contract packets and branch etc etc

  
  Global Resources
  ----------------

  The Redis is used for session & route caching

  The Mongo is used for general deployment data and can be a different Mongo Server
  than any of the Quarry Database mongos (or the same - it uses a different database)

  Warehouses
  ----------

  The reception acts as the logic gate for all requests

  The switchboard is the pub/sub server for the whole stack

  The holdingbay is the resolver for the whole stack and hooked up to the switchboard

  The router looks after all of the providers

  Each provider, supplier and endpoint will be passed the stack config and can therefore hook
  the requests / responses up to the switchboard for fast replying/rerouting of requests


  Stack config:
  ---------------------------------------------------

  {
    hostname:...,


    global:{

      // for each of the global resources, the host/port
      // points to the IP we connect to directly
      // load-balancing is handled at the other end by this IP not by us
      // (because we are speaking native Redis/Mongo to these connections)
      redis:{
        host:...,
        port:...
      },
      mongo:{
        host:...,
        port:...
      }
    },

    warehouses:{

      // in each case for the warehouses the host/port
      // points to a cluster router that will look after load-balancing
      reception:{
        host:...,
        port:...
      },

      switchboard:{
        host:...,
        port:...
      },

      router:{
        host:...,
        port:...
      },

      holdingbay:{
        host:...,
        port:...
      }

    }



  The global resources are:

  Redis Connection -  The deployment wide Redis server connection details



  The warehouse resources are:

  Reception -         the entry point for any request
                      normal requests are sent to the router
                      resolving requests are sent to the holding bay
                      message requests are sent to the switchboard

  Switchboard -       the pub/sub server for portals, container events and request branching/responding

  Router -            The main switch to the suppliers based on the root path
                      Any new request off into the network is sent here to be routed to the correct end-point

  Holding Bay -       the warehouse for requests currently being resolved within this deployment
                
                      the holding bay keeps requests by their ids and bakes the bayid into the request
                      before it's sent to the router

                      then at any stage these methods are mapped onto the request:

                        branch
                        reroute

                      these 2 methods emit an event onto the switchboard with the request_id and bay_id
                      the holding bay then knows either the request has been replaced (reroute) or augmented with
                      another thing to wait for and then merge (branch)



 */

exports = module.exports = factory;

/*

  Returns a factory function to create new containers

  This allows you to customize the container and model behaviour
  before they are instantiated

 */
function factory(options){

  var stack = new StackClass(options);

  return stack;
}