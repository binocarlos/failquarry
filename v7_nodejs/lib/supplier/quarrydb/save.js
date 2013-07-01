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

var tools = require('./tools');
var eyes = require('eyes');
var load_containers = require('./load_containers');
var utils = require('../../utils');

/*
  Quarry.io Quarrydb -> save
  ----------------------------------

  save container data

  options
  -------

  {
    
  }

 */

var save = module.exports = function(mongoclient){

  return function(req, res, next){

    load_containers(mongoclient, req, res, function(error, containers){

      var self = this;

      if(error || !containers || containers.length<=0){
        res.error('cannot find container');
        return;
      }

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      eyes.inspect(containers);


      var originaldata = containers[0];

      var query = {
        "_id":originaldata.meta.quarryid
      }

      var newdata = utils.extend(originaldata, req.body);
      delete(newdata._id)
 
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      eyes.inspect(newdata);

      tools.save(mongoclient, {
        "meta.quarryid":newdata.meta.quarryid
      }, newdata, function(error){
        if(error){
          res.error(error);
        }
        else{
          res.send(newdata);
        }
      })

    })
  }
}