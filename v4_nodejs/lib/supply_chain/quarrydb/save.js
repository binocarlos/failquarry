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
    EventEmitter = require('events').EventEmitter,
    eyes = require('eyes'),
    containerFactory = require('../../container'),
    utils = require('../../utils'),
    async = require('async');
    
/*
  Quarry.io Quarrydb -> save
  ----------------------------------

  save container data

  options
  -------

  {
    
  }

 */

function save(mongo_client, packet, callback){

  var message = packet.message;

  // the id of the container we want to save
  var target_id = _.isObject(message.target) ? message.target._meta.quarryid : message.target;

  var insert_data = _.clone(message.data);

  delete(insert_data._data);
  delete(insert_data._children);

  if(!insert_data._id){
    insert_data._id = insert_data._meta.quarryid;
  }
  
  mongo_client.upsert({
    "_meta.quarryid":target_id
  }, insert_data, function(error){
    packet.answer = {
      ok:!error,
      error:error,
      results:insert_data
    }
    // we are done!
    callback(null, packet);
  })
}

// expose createModule() as the module
exports = module.exports = save;

