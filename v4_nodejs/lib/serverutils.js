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

var fs = require('fs');
var util = require('util');

var utils = {};

module.exports = utils;

/**
 * copy a to b
 */

utils.copyfile = function(src, dst, cb){

  function copy(err) {
    var is
      , os
      ;

    if (!err) {
      return cb(new Error("File " + dst + " exists."));
    }

    fs.stat(src, function (err) {
      if (err) {
        return cb(err);
      }
      is = fs.createReadStream(src);
      os = fs.createWriteStream(dst);
      util.pump(is, os, cb);
    });
  }

  fs.stat(dst, copy);
}

/**
 * move a to b
 */

utils.movefile = function(src, dst, cb){

  function copyIfFailed(err) {
    if (!err) {
      return cb(null);
    }
    utils.copyfile(src, dst, function(err) {
      if (!err) {
        // TODO 
        // should we revert the copy if the unlink fails?
        fs.unlink(src, cb);
      } else {
        cb(err);
      }
    });
  }

  fs.stat(dst, function (err) {
    if (!err) {
      return cb(new Error("File " + dst + " exists."));
    }
    fs.rename(src, dst, copyIfFailed);
  });
}