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

/**
 * Module dependencies.
 */

var fs = require('fs');
var wrench = require('wrench');
var eyes = require('eyes');
var serverutils = require('../serverutils');
var async = require('async');

/*
  Quarry.io Image Chunker
  -----------------------

  File processer chunker that can apply image magick commands

  Chunker Message format - this is passed into each loop with different args - this can be gridded

    {

      // the single command to apply
      command:{
        name:'size',
        options:400
      },

      // the source image
      input:...

      // where to write the output image
      output:...

    }    

  
 */

module.exports = factory;


/*
  Each file inside of imagechunker exposes some functions on module.exports

  All files are globbed together and this is a map of all command names from all files merged

  (i'ts easy to add new commands - just add anyname.js into imagechunker and):

    // in = the full filepath to start with
    // out = where to put the result
    // env = an object that previous commands can mess with
    // options = the parameters for the command
    // callback = run this when the command has finished
    module.exports.funkycommand = function(packet, callback){
      var file_in = packet.in;
      var file_out = packet.out;
      var env = packet.env;
      var options = packet.options;
  
    }
 */
var commands = {};

/*
  auto load each of the commands
 */

fs.readdirSync(__dirname + '/imagechunker').forEach(function(filename){
  if (!/\.js$/.test(filename)) return;
  var name = basename(filename, '.js');
  var chunker = require('./imagechunker/' + name);
  _.each(chunker, function(fn, command_name){
    commands[command_name] = fn;
  })
})



function factory(options){

  options || (options = {});

  options = _.defaults(options, {
    
  
  })

  function chunker(packet, callback){
    var command = packet.command;

    var command_name = command.name;

    // lets see if we have this command loaded
    if(!commands[command_name]){
      // no - so lets just fake it for a minute
      callback(null, packet.filein);
      return;
    }

    var command_function = commands[command_name];

    var command_packet = {
      env:packet.env,
      options:command.options,
      filein:packet.filein,
      fileout:packet.fileout
    }

    command_function(command_packet, callback);
  }

  return chunker;

}









