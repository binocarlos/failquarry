#!/usr/bin/env node

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
        