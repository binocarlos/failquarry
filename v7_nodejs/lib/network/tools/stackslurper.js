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
var jsonloader = require('../../tools/jsonloader');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');
var browserify = require('browserify');
var compressor = require('node-minify');
var wrench = require('wrench');
var Container = require('../../container');
var Departments = require('../../department');

module.exports = parsestacks;

/*

  quarry.io - stack parser

  input: stack folder location
  output: stack container data

  
*/

function parsestacks(folders, systemconfig, callback){

  if(!_.isArray(folders)){
    folders = [folders];
  }

  var stacks = [];

  /*
  
    first thing get the folder copied into the quarry build
    
  */

  async.forEach(folders, function(srcfolder, nextstack){

    var buildid = utils.littleid();
    var folder = systemconfig.attr('systemfolders.builds') + '/' + buildid;

    wrench.mkdirSyncRecursive(folder);
    wrench.mkdirSyncRecursive(folder + '/src');
    wrench.mkdirSyncRecursive(folder + '/build');
    wrench.mkdirSyncRecursive(folder + '/config');
    wrench.mkdirSyncRecursive(folder + '/run');
    wrench.mkdirSyncRecursive(folder + '/log');

    wrench.copyDirSyncRecursive(srcfolder, folder + '/src');

    var configpath = folder + '/src/quarry.json';

    var stack = null;

    /*
    
      check for syntax errors in the stackfile
      
    */
    jsonloader(configpath, function(error, rawstack){

      /*
      
        now we can replace values with data
        
      */
      var rendered = ejs.render(JSON.stringify(rawstack), {
        quarry:{
          folder:path.normalize(__dirname + '/../..')
        },
        stack:{
          folder:folder + '/src',
          corefolder:folder + '/build',
          logfolder:folder + '/log'
        }
      })

      var data = JSON.parse(rendered);
      data.config.folder = folder;

      /*
      
        this turns the raw json into some containers
        
      */
      var stack = process_raw_stack(data, buildid);

      compile_stack_code(stack, systemconfig, function(){
        stacks.push(stack);
        nextstack();
      })
      
    })
  }, function(error){
    callback(error, stacks);
  })
  
}

function process_raw_stack(rawstack, buildid){

  var stack = Container.new('stack', rawstack.config);
  stack
    .id(buildid)
    .attr({
      buildid: buildid,
      corefolder:stack.attr('folder') + '/build',
      logfolder:stack.attr('folder') + '/log'
    })

  var location = Container.new('location', {
    name:'Localhost',
    host:'127.0.0.1'
  })

  stack.append(location);


  /*
  
    a map of the jobs we found by department
    
  */
  var departmentjobs = {};

  var joblist = Container.new('joblist');

  function makejob(rawjob){
    /*
            
      make sure we have a 'core' job in each department
      (otherwise nothing will be booted)

      we can then assign workers to these core jobs
      to get the stack booted
      
    */
    var job = Container.new('job', rawjob);
/*
    if(Departments.bootfirst[job.attr('department')]){
      job.addClass('bootfirst');
    }
    else{
      job.addClass('bootafter');
    }
*/
    job.addClass(job.attr('department'));

    departmentjobs[job.attr('department')] || (departmentjobs[job.attr('department')] = []);
    departmentjobs[job.attr('department')].push(job);

    joblist.append(job);

    return job;
  }

  _.each(rawstack.jobs || [], makejob);


  /*
  
    the tasklist is the list of services we run within each department

    the start is to give the whole tasklist to one job per department

    all jobs then given to one worker
    
  */
  _.each(Departments, function(name){

    if(!departmentjobs[name]){
      makejob({
        department:name
      })
    }
  })

  stack.append(joblist);
  
  return stack;
}

/*

  compile the browser side container code and get it ready for injection into the stack

  the stack config can change how the core code is built here (well later once 
  Rodney finishes running around like Robin from Batman : )
  
*/
function compile_stack_code(stack, systemconfig, callback){
  var codefolder = stack.attr('folder');
  
  var b = browserify();

  b.require(__dirname + '/../../container');
  var st = b.bundle();

  fs.writeFileSync(codefolder + '/config/stack.json', JSON.stringify(stack.toJSON(), null, 4), 'utf8');
  fs.writeFileSync(codefolder + '/config/system.json', JSON.stringify(systemconfig.toJSON(), null, 4), 'utf8');

  fs.writeFileSync(codefolder + '/build/browser.js', st, 'utf8');

  new compressor.minify({
    type: 'uglifyjs',
    fileIn: codefolder + '/build/browser.js',
    fileOut: codefolder + '/build/browser.min.js',
    callback: function(error){
      if(error){
        throw new Error(error);
      }
      callback();
    }
  })
  
}