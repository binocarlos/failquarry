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

