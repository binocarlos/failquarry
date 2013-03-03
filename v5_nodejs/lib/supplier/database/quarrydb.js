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