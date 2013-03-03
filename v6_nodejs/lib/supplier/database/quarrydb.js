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