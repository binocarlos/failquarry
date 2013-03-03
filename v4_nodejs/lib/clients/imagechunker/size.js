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

var im = require('imagemagick');
var eyes = require('eyes');

/*
  Quarry.io Size Chunker
  -----------------------

  Does size, width and height

  
 */

function scale_size(size, env){
  return env.retina ? size * 2 : size;
}

// returns aXb and multiplies by 2 if env.2x is set
function get_size_argument(size, env){
  var string = '' + size;
  if(!string.match(/x/i)){
    return '' + scale_size(parseInt(string), env);
  }
  else{
    var parts = _.map(string.split('x'), function(part){
      return scale_size(parseInt(part), env);
    })

    return parts.join('x');
  }
}

module.exports.size = function(packet, callback){

  var size = get_size_argument(packet.options, packet.env);

  // -resize 100x100
  var option = size + 'x' + size + '\>';

  im.convert([packet.filein, '-resize', option, packet.fileout], callback);
}

module.exports.width = function(packet, callback){
  var size = get_size_argument(packet.options, packet.env);

  // -resize 100x
  var option = size + 'x\>';

  im.convert([packet.filein, '-resize', option, packet.fileout], callback);
}

module.exports.height = function(packet, callback){
  var size = get_size_argument(packet.options, packet.env);

  // -resize x100
  var option = 'x' + size + '\>';

  im.convert([packet.filein, '-resize', option, packet.fileout], callback);
}
