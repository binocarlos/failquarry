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
    tools = require('./tools'),
    async = require('async');
    
/*
  Quarry.io Quarrydb -> delete
  ----------------------------------

  delete container data

  options
  -------

  {
    
  }

 */

var del = module.exports = function(skeleton, callback){
  var self = this;
  tools.del(self.mongoclient, skeleton, function(){
    callback(null, {
      action:'delete',
      target:skeleton.id
    })
  })
  
}