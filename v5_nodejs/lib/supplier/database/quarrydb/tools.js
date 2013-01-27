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
    containerFactory = require('../../../container'),
    utils = require('../../../utils'),
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

function save(mongo_client, data, callback){

  var insert_data = _.clone(data);
  
  delete(insert_data._route);
  delete(insert_data._children);

  if(!insert_data._id){
    insert_data._id = insert_data._meta.quarryid;
  }
  
  mongo_client.upsert({
    "_meta.quarryid":insert_data._meta.quarryid
  }, insert_data, function(error, res){
    callback(error, insert_data);
  })
}

// expose createModule() as the module
module.exports.save = save;

