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
    fs = require('fs'),
    eyes = require('eyes'),
    ramSupplier = require('./ram'),
    containerFactory = require('../container'),
    async = require('async');
    
/*
  Quarry.io JSON File Supplier
  -------------------

  A supplier that points to a JSON file on disk (or somewhere)

  It loads the json into memory and then performs the selection in-memory

  This ALWAYS uses inner-process network for contract resolving (as it uses the RAM supplier)

  options
  -------

  {
    file:__dirname + '/test.json'
  }

 */

// expose createModule() as the module
exports = module.exports = factory;

// the messages after which we commit to disk
var save_after_actions = {
  append:true,
  save:true
}

function factory(options, ready_callback){

  options || (options = {});

  if(!options.file){
    throw new Error('json_file supplier requires a file')
  }

  // the top level container we will search
  var ram_supply_chain = null;

  // a wrapper for a RAM supplier that triggers a save on some actions
  var json_file = function(packet, callback){

    // pass the message off to the RAM supplier
    ram_supply_chain(packet, function(error, res){

      // check if the action requires us to save the JSON file
      if(save_after_actions[packet.action]){

        save_data(options.file, get_save_data());
        
      }
      
      callback && callback(error, res);

    })
   
  }

  json_file.options = options;

  load_data(options.file, function(error, file_data){
    
    ready_callback && ready_callback(error, json_file);
  })

  // get the raw data from a container
  function get_save_data(){
    var data = ram_supply_chain.data();

    var container = containerFactory(data);

    var root_raw = container.raw(function(data){
      delete(data._data);
      delete(data._pointer);
      return data;
    });

    return root_raw._children;
  }

  /*
    Load the raw JSON string
   */
  function load_data(file, callback){
    // lets load the json data
    // very tolerant at the moment - when we get admin logging we can
    // check for errors
    fs.readFile(file, 'utf8', function(error, content){
      var raw_data = [];
      if(error || !content){

      }
      else{

        try{
          raw_data = JSON.parse(content);
        }
        catch(e){
          throw e;
        }
      }

      // now lets process for ids and such forth
      var root_container = containerFactory(raw_data);

      // we want this so raw data has an id inserted if needed
      root_container.recurse(function(container){

      })

      ram_supply_chain = ramSupplier(raw_data);

      // now save the file back so the ids are good
      var raw_data = get_save_data();

      save_data(file, raw_data);

      callback(null, raw_data);
    })
  }

  /*
    Save the raw JSON string
   */
  function save_data(file, data){

    var json_string = options.pretty ? JSON.stringify(data, null, 4) : JSON.stringify(data);

    fs.writeFileSync(file, json_string, 'utf8');
  }

  return json_file;
}



