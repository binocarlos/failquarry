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