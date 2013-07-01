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
var util = require('util');
var utils = require('../../utils');
var eyes = require('eyes');
var _ = require('lodash');
var async = require('async');
var wrench = require('wrench');
var fs = require('fs');
var counter = 17778;

module.exports = function(flavour, runfolder, usehost){

  if(!fs.existsSync(runfolder)){
    throw new Error('run folder must exist')
  }

  return {
    http:function(host){
      return {
        host:host || usehost || '127.0.0.1',
        port:counter++
      }
    },
    quarry:function(host, type){
      return flavour=='development_DONOTMATCH' ? 
        'ipc://' + runfolder + '/socket' + (utils.littleid()) + (type || '') :
        'tcp://' + (host || usehost || '127.0.0.1') + ':' + (counter++)
    }
  }

}