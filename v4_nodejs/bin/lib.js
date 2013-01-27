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


/**
 * Module dependencies.
 */

var colors = require('colors');
var async = require('async');

var packageJSON = require(__dirname + '/../package.json');

module.exports.hr = function(){
  console.log('------------------------------------------------'.grey);
}

module.exports.introduce = function(){
  this.hr();
  console.log('quarry.io'.cyan + ' stack version ' + packageJSON.version.green);
}

module.exports.is_installed = function(callback){

}

module.exports.ask_questions = function(program, questions, callback){
  var answers = {};

  async.forEachSeries(questions, function(question, nextQuestion){

    program.prompt((question.title + ': ').cyan + ' ', function(val){
      answers[question.property] = val;
      nextQuestion();
    })
  }, function(error){

    callback && callback(error, answers);
    

  })
}
        