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
    fs = require('fs'),
    xmlParser = require('../../container/xml'),
    ramFactory = require('../ram'),
    async = require('async');

module.exports = factory;

/*
  Quarry.io XML file Supplier
  ---------------------------

  Wrapper for a RAM supplier that saves XML files

  options
  -------

  {
    
  }

 */

function factory(options){

  options || (options = {});

  var path = options.file;

  if(!path){
    throw new Error('xml file supplier requires a file option');
  }

  function router(warehouse, ready_callback){

    fs.readFile(path, 'utf8', function(error, xml_string){
      if(error){
        xml_string = [];
      }

      var ram = ramFactory({
        data:xml_string
      })

      ram(warehouse, function(error, cache){

        function save_file(saved_callback){
          var xml_string = cache.root.toXML();

          fs.writeFile(path, xml_string, 'utf8', saved_callback);
        }

        // save the file to make sure ids are embedded
        save_file(ready_callback);

        function save_file_route(packet, next){
          save_file(function(error){
            next();
          })
        }

        warehouse.after('quarry:///append', save_file_route);
        warehouse.after('quarry:///save', save_file_route);
        warehouse.after('quarry:///delete', save_file_route);

      })


    })
  }

  return router;
}