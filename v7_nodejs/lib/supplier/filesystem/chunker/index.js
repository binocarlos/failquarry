/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/**
 * Module dependencies.
 */

var fs = require('fs');
var _ = require('lodash');
var eyes = require('eyes');
var async = require('async');
var wrench = require('wrench');
var path = require('path');
var fstools = require('../../tools/fstools');

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

  this sets the order of commands
  
*/
var commandorder = [
  'size'
]

/*
  auto load each of the commands
 */

fs.readdirSync(__dirname + '/imagechunker').forEach(function(filename){
  if (!/\.js$/.test(filename)) return;
  var name = path.basename(filename, '.js');
  var chunker = require('./imagechunker/' + name);
  _.each(chunker, function(fn, command_name){
    commands[command_name] = fn;
  })
})



function factory(options){

  options || (options = {});

  options = _.defaults(options, {
    tempfolder:'/tmp/quarry/cache'
  })

  wrench.mkdirSyncRecursive(options.tempfolder, 0777);

  function chunker(file, params, callback){
    
    var stack = [];
    var filenameappends = [];
    _.each(commandorder, function(key){
      if(params[key]!=null){
        stack.push({
          name:key,
          value:params[key]
        })
        filenameappends.push(key + '=' + params[key]);
      }
    })

    if(stack.length<=0){
      callback(null, file);
      return;
    }

    var ext = path.extname(file);
    var inputfilename = path.basename(file, ext);
    var outputfilename = inputfilename + '_' + filenameappends.join('_');

    var sourcedir = path.dirname(file);
    var outputdir = options.tempfolder + sourcedir;
    
    var finaloutput = outputdir + '/' + outputfilename + ext;

    function getcachesequencefile(index){
      return outputdir + '/' + outputfilename + index + ext;
    }

    var index = 0;
    var input = getcachesequencefile(index);
    var output = getcachesequencefile(index+1)

    async.series([

      function(next){
        fs.stat(finaloutput, function(error, stat){
          if(!error || stat){
            callback(null, finaloutput);
            return;
          }
          next();
        })
      },

      function(next){

        wrench.mkdirSyncRecursive(outputdir, 0777);

        fstools.copyFile(file, input, next);
      },

      function(next){

        async.forEachSeries(stack, function(command, nextstack){
          
          // lets see if we have this command loaded
          if(!commands[command.name]){
            // no - so lets just fake it for a minute
            callback(null, file);
            return;
          }

          var command_function = commands[command.name];

          var command_packet = {
            options:command.value,
            filein:input,
            fileout:output
          }

          command_function(command_packet, function(){

            fs.unlink(input, function(){
              if(index+1<stack.length-1){
                index++;
                input = output;
                output = getcachesequencefile(index+1);  
              }
              nextstack();
            })

          })
        }, next)
      },

      function(next){

        fstools.copyFile(output, finaloutput, function(){
          fs.unlink(output, next);
        })
      }

    ], function(){
      callback(null, finaloutput);
    })
  }

  return chunker;
}