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
var wrench = require('wrench');
var eyes = require('eyes');
var serverutils = require('../serverutils');
var async = require('async');

/*
  Quarry.io File Processor
  -----------------------

  Generic reduction cycle for applying commands to filenames

  Triggers a chunker which will apply each step
  
  Entry Message format:

    {
      // the array of commands
      stack:[{
        name:'size',
        options:400
      }],

      // the working folder
      folder:...

      // the desired output filename in the working folder
      file:...

      // the original file (we leave this alone and copy it into folder to start off)
      original:...
    }
  
 */

module.exports = factory;

function factory(options){

  options || (options = {});

  options = _.defaults(options, {
    
    // a pointer to the function we pass each step onto
    // if this is null then it means we operate self-container
    // (i.e. pass the next chunk to ourselves)
    chunker:defaultchunker
  })

  var chunker = options.chunker;

  /*
    Convert image.png -> image.0.png
   */
  function get_indexed_filename(filename, index){
    var parts = filename.split('.');
    var ext = parts.pop();
    parts = parts.concat([index, ext]);
    return parts.join('.');
  }

  // the default chunker is to just copy the file and return
  function defaultchunker(packet, callback){

    var file_in = packet.in;
    var file_out = packet.out;
    var env = packet.env;
    var command = packet.command;

    // we fake it back
    callback(null, file_in);
  }

  function process(packet, finished_callback){

    // first we need to get the original into our working folder (which we must create)
    wrench.mkdirSyncRecursive(packet.folder, 0777);

    var starting_filename = get_indexed_filename(packet.file, 0);

    serverutils.copyfile(packet.original, packet.folder + '/' + starting_filename, function(error){

      var stack_index = 0;

      // the last file we built - we auto-delete each last step in the build
      // this ends up as the final output we copy back into the packet.file destination
      var last_filename = null;

      // we allow chunkers to modify the overall state object here
      // the retina command does this for scaling (for example)
      var env = {};

      // we now have the original image in our working folder
      // time to loop over the stack
      async.forEachSeries(packet.stack, function(command, next_command){

        var filein = packet.folder + '/' + get_indexed_filename(packet.file, stack_index);
        var fileout = packet.folder + '/' + get_indexed_filename(packet.file, stack_index+1);

        chunker({
          command:command,
          env:env,
          filein:filein,
          fileout:fileout
        }, function(error, chunker_out){

          if(error){
            next_command(error);
          }

          // if the chunker did not do anything special in terms of return value
          // we assume that we use the standard next step (i.e. they have created the out path)
          if(!chunker_out){
            chunker_out = fileout;
          }

          /*
            We have done one chunk - move on
           */
          last_filename = chunker_out;

          /*
            If we have moved onto another file - remove the old one
           */
          if(last_filename!=filein){
            // remove the last build image
            fs.unlink(filein, function(){

              // update the index for the next loop
              stack_index++;

              // move on
              next_command();
            })
          }
          else{
            next_command();
          }

          
        })

      }, function(error){

        if(error){
          packet.answer = packet.original;
          finished_callback(error, packet);
          return;
        }
        
        /*
          We have the final output now inside of last_filename
          We copy this to the final path (packet.folder + packet.file) and remove the final build image
         */

        serverutils.movefile(last_filename, packet.folder + '/' + packet.file, function(error){

          /*
            The output has been built - send back the fullpath in the answer
           */
          packet.answer = packet.folder + '/' + packet.file;
          finished_callback(null, packet);

        })
      })

    })
  }

  return process;

}








