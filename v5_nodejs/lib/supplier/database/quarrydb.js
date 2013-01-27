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

var _ = require('underscore'),
    eyes = require('eyes'),
    async = require('async'),
    mongo = require('../../servers/mongo'),
    select_helper = require('./quarrydb/select'),
    append_helper = require('./quarrydb/append'),
    save_helper = require('./quarrydb/save');

module.exports = factory;

/*
  Quarry.io RAM Supplier
  -------------------

  In memory supplier

  options
  -------

  {
    
  }

 */

function factory(options){

  options || (options = {});

  options = _.defaults(options, {
    collection:'bob'
  })

  var mongo_client = null;

  function router(warehouse, ready_callback){
    
    // preapre the mongo connection for our collection
    mongo(options, function(error, client){
      mongo_client = client;

      var select_route = select_helper(mongo_client, warehouse.radio());
      var append_route = append_helper(mongo_client, warehouse.radio());
      var save_route = save_helper(mongo_client, warehouse.radio());

      warehouse.use('quarry:///select', select_route);
      warehouse.use('quarry:///append', append_route);
      warehouse.use('quarry:///save', save_route);

      ready_callback && ready_callback(null, warehouse);
    })

  }

  return router;
}