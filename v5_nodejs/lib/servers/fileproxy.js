
/**
 * Module dependencies.
 */

var wrench = require('wrench');
var url = require('url');
var http = require('http');
var fs = require('fs');
var path = require('path');
var request = require('request');
var eyes = require('eyes');
var imagechunker_factory = require('./imagechunker');
var fileprocessor_factory = require('./fileprocessor');
var _ = require('lodash');

module.exports = factory;

function factory(options){

  options || (options = {});

  options = _.defaults(options, {
    directory:'/tmp/quarryfileproxy',
    baseurl:'/quarry.io/fileproxy',
    hostname:'dev.jquarry.com',
    // a raw image chunker that points to itself
    imagechunker:imagechunker_factory()
  })

  // a map of file extension onto the chunkers activated for them
  var chunker_map = {
    'gif':options.imagechunker,
    'png':options.imagechunker,
    'jpg':options.imagechunker,
    'jpeg':options.imagechunker
  }

  // reset the file cache on restart

  // we pass true so if the folder is not there we do not mind (failSilently)
  wrench.rmdirSyncRecursive(options.directory, true);
  wrench.mkdirSyncRecursive(options.directory, 0777);

  /*
    Returns a local path for the file in the cache
   */
  function get_cached_path(parsed_url, commands){
    var pathparts = _.filter([parsed_url.host].concat(parsed_url.pathname.split('/')), function(chunk){
      return !_.isEmpty(chunk);
    })

    var filename = pathparts[pathparts.length-1];
    var filenameparts = filename.split('.');
    var ext = filenameparts[filenameparts.length-1];

    if(commands){

      var original_filepath = pathparts.pop();
      pathparts.push(original_filepath.replace(/\./g, ''));

      _.each(commands, function(command){

        if(!command.options){
          pathparts.push(command.name);
        }
        else if(_.isObject(command.options)){
          var options_string = JSON.stringify(command.options).replace(/\W/g, '');
          pathparts.push(command.name + '_' + options_string);
        }
        else{
          pathparts.push(command.name + '_' + command.options);
        }
      })

      pathparts.push('output.' + ext);
    }

    var filepath = pathparts.join('/');

    var full_path = options.directory + '/' + filepath;

    return full_path;
  }

  /*
    This makes sure the plain file is downloaded into the cache
   */
  function ensure_plain_file(parsed_url, headers, callback){

    var cache_path = get_cached_path(parsed_url);

    fs.stat(cache_path, function(error, stat){
      if(!error && stat){
        // we already have the plain ol file local!
        callback(null, cache_path);
      }
      else{

        var cache_directory = cache_path.split('/');
        cache_directory.pop();
        cache_directory = cache_directory.join('/');

        wrench.mkdirSyncRecursive(cache_directory, 0777);

        var downloadfile_stream = fs.createWriteStream(cache_path);

        request({
          url:parsed_url,
          headers:headers,
        }, function(){          
          callback(null, cache_path);
        }).pipe(downloadfile_stream);
      }
    })
  }

  return function(req, res){

    var basepath = req.path.replace(options.baseurl, '');
    var parts = basepath.split('/');

    var urlstring = 'http:' + decodeURIComponent(parts[1]);
    var command_stack = decodeURIComponent(parts[2]);

    var commands = JSON.parse(command_stack);
    var parsed_url = url.parse(urlstring);

    // first lets see if we have already processed this image
    var final_cache_path = get_cached_path(parsed_url, commands);
    var final_cache_directory = path.dirname(final_cache_path);
    var final_cache_file = path.basename(final_cache_path);

    fs.stat(final_cache_path, function(error, stat){
      if(!error && stat){

        // yay - we have an already built file ready to ship
        res.sendfile(final_cache_file, {
          root:final_cache_directory
        })
        return;
      }

      // right - we must grab the plain file
      ensure_plain_file(parsed_url, req.headers, function(error, plain_filepath){

        var plain_directory = path.dirname(plain_filepath);
        var plain_file = path.basename(plain_filepath);
        var plain_ext = path.extname(plain_filepath).replace(/^\./, '');

        var chunker = chunker_map[plain_ext];

        /*
          There is no chunker for this filetype so just pipe the file raw

         */
        if(!chunker){
          res.sendfile(plain_file, {
            root:plain_directory
          })
          return;
        }

        var output_directory = path.dirname(final_cache_path);
        var output_file = path.basename(final_cache_path);

        /*
          prepare the packet for the image chunker

          TODO - allow for different file types (like video) to have a different chunker
         */

        var packet = {
          stack:commands,
          folder:output_directory,
          file:output_file,
          original:plain_filepath
        }

        // make a new file processor with the correct chunker
        var processor = fileprocessor_factory({
          chunker:chunker
        })

        // off we go! hopefully we get a nice new image out of this...
        processor(packet, function(error, answer_packet){

          if(error){
            res.send(500, { error: error });
            return;
          }

          /*
            We have an answer from the fileprocessor
            We can serve the file now
           */
          var final_source = answer_packet.answer;

          var final_directory = path.dirname(final_source);
          var final_file = path.basename(final_source);

          res.sendfile(final_file, {
            root:final_directory
          })
        })

      })
    })
  }

}








