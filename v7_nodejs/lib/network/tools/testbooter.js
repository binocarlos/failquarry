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

var Warehouse = require('../../warehouse');
var Container = require('../../container');
var Device = require('../device');

var Job = require('../job');

/*

  Quarry.io - Test Deployment
  ---------------------------

  Get it all up and running one one process with minimal sockets
  
*/
module.exports = function(stack){

  if(!stack){
    throw new Error('test fixer requires a stack');
  }

  var hq = stack.find('hq');
  var location = stack.find('location');
  var booter = {};

  /*
  
    in the test booter we just load the job

    on network mode the same JSON ends up loading the job
    in the same way (important innit)
    
  */
  function bootjob(job, done){
    console.log('-------------------------------------------');
    console.log('boot job');
    console.log(job.summary());

    console.log('-------------------------------------------');
    
    var job = Job({
      hq:hq.toJSON(),
      job:job.toJSON(),
      location:location.toJSON()
    })

    job.run(function(){
      console.log('-------------------------------------------');
      console.log('job booted');
      done();
    })

  }

  booter.start = function(done){

    var joblist = stack.find('joblist');
    var bootfirst = joblist.find('.bootfirst');
    var bootafter = joblist.find('.bootafter');

    async.series([

      function(next){
  
        async.forEachSeries(bootfirst.containers(), bootjob, next);

      },

      function(next){

        async.forEachSeries(bootafter.containers(), bootjob, next);

      }

    ], done)
  }

  _.extend(booter, EventEmitter.prototype);

  return booter;  
}