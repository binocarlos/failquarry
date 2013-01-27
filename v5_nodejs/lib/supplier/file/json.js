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
    fs = require('fs'),
    xmlParser = require('../../container/xml'),
    ramFactory = require('../ram'),
    async = require('async');

module.exports = factory;

/*
  Quarry.io JSON file Supplier
  ---------------------------

  Wrapper for a RAM supplier that saves JSON files

  options
  -------

  {
    
  }

 */

function factory(options){

  options || (options = {});

  var path = options.file;

  if(!path){
    throw new Error('json file supplier requires a file option');
  }

  function router(warehouse, ready_callback){

    fs.readFile(path, 'utf8', function(error, json_string){
      if(error){
        json_string = '[]';
      }

      if(_.isEmpty(json_string)){
        json_string = '[]';
      }

      var raw_data = [];

      try{
        raw_data = JSON.parse(json_string);
      }
      catch(e){
        throw new Error(e);
      }

      var ram = ramFactory({
        data:raw_data
      })

      ram(warehouse, function(error, cache){

        function save_file(saved_callback){
          var json_string = options.pretty ? JSON.stringify(cache.root.toJSON(), null, 4) : JSON.stringify(cache.root.toJSON());

          fs.writeFile(path, json_string, 'utf8', saved_callback);
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