#!/usr/bin/env node

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