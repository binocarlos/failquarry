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

var _ = require('lodash');
var eyes = require('eyes');

var drivers = {};

_.each([
  'directory'
], function(driver){
  drivers[driver] = require('./fileserver/' + driver);
})

module.exports = factory;

/*

  supplier constructor
  
*/

function factory(type, config, system){

  if(arguments.length<=0){
    throw new Error('fileserver factory requires a type');
  }
  else{
    config || (config = {});

    if(!type){
      throw new Error('Supplier requires type in config');
    }

    var FileServerClass = require('./fileserver/' + type.replace(/^quarry\./, '').replace(/\./g, '/'));

    return new FileServerClass(config, system);
  }
}

/*

  expose each of the drivers via

  
*/

_.extend(factory, drivers);