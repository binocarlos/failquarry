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
    mongo = require('../../vendor/server/mongo'),
    select_helper = require('./quarrydb/select'),
    append_helper = require('./quarrydb/append'),
    save_helper = require('./quarrydb/save'),
    delete_helper = require('./quarrydb/delete');

var ContainerSupplier = require('../container');

/*
  Quarry.io - RAM Supplier
  ------------------------

  Holds containers in memory and performs actions


 */


var QuarryDBSupplier = module.exports = ContainerSupplier.extend({

  prepare:function(ready){
    var self = this;

    this.connect(function(){
      ContainerSupplier.prototype.prepare.apply(self, [ready]);  
    })
  },

  connect:function(ready){
    var self = this;

    var collection = (!_.isEmpty(this.get('collection_prepend')) ? this.get('collection_prepend') : '') + (this.get('path') || '').replace(/\//g, '');
    var options = _.defaults(this.toJSON(), {
      collection:collection
    })

    // preapre the mongo connection for our collection
    mongo(options, function(error, client){
      self.mongoclient = client;
      ready && ready();
    })
    
  },

  selector:select_helper,

  appender:append_helper,

  save:save_helper,

  delete:delete_helper
})