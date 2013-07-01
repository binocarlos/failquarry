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


var utils = require('../../utils')
  , eyes = require('eyes')
  , _ = require('lodash');

var async = require('async');
var EventEmitter = require('events').EventEmitter;
var wrench = require('wrench');
var fs = require('fs');
var Warehouse = require('../../warehouse');
var Container = require('../../container');
var Device = require('../device');

var Job = require('../job');

/*

  Quarry.io - Test Deployment
  ---------------------------

  Get it all up and running one one process with minimal sockets
  
*/
module.exports = function(stack, systemconfig){

  if(!stack){
    throw new Error('test fixer requires a stack');
  }

  var hq = systemconfig;
  var location = stack.find('location');

  var id = stack.attr('buildid');
  var folder = stack.attr('folder') + '/run';

  var booter = {
    id:id,
    folder:folder,
  };

  wrench.mkdirSyncRecursive(folder);

  var counters = {};

  function department_index(dep){
    counters[dep] || (counters[dep] = 0);
    return counters[dep]++;
  }

  /*
  
    in the test booter we just load the job

    on network mode the same JSON ends up loading the job
    in the same way (important innit)
    
  */
  function bootjob(job, done){
    var data = JSON.stringify({
      hq:hq.toJSON(),
      job:job.toJSON(),
      location:location.toJSON()
    }, null, 4)

    var index = department_index(job.attr('department'));

    fs.writeFile(folder + '/' + job.attr('department') + '.' + index + '.json', data, 'utf8', done);

  }

  booter.build = function(done){

    var joblist = stack.find('job');

    async.forEachSeries(joblist.containers(), bootjob, done);
    
  }

  _.extend(booter, EventEmitter.prototype);

  return booter;  
}