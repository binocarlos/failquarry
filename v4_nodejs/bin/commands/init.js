#!/usr/bin/env node

/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Single command for the main index script

  This is responsible for creating a new stack deployment from the current working folder

 */

/**
 * Module dependencies.
 */

var colors = require('colors');
var deployment_factory = require('../../lib/deployment');
var lib = require('../lib');
var async = require('async');

var factory = function(program, options){

  options = options || {};

  program
  .command('init')
  .description('create a new quarry.io deployment')
  .action(function(env, options){
    
    var deployment = deployment_factory({
      file:program.file
    })

    lib.introduce();

    deployment.exists(function(error, stat){
      
      if(!error && stat){
        console.log('quarry.io is already installed into: ' + (deployment.file).cyan);
      }
      else{
        lib.hr();
        console.log('installing quarry.io into: ' + (deployment.file).yellow);
        lib.hr();
        
        var questions = [{
          title:'Deployment Name',
          property:'name'
        },{
          title:'Administrator (You!) Email',
          property:'email'
        }]

        lib.ask_questions(program, questions, function(error, profile){
          deployment.create(profile);

          lib.hr();

          console.log('for GIT or SVN users:');
          console.log('add ' + (deployment.file.split('/').pop()).yellow + ' to your .gitignore or .svnignore file');

          lib.hr();

          console.log('quarry.io installed ok!'.green);

          lib.hr();

          process.stdin.destroy();
        })
      }

    })
    
  
  })
  
}

module.exports = factory;