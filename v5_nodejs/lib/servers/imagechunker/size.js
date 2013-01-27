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
