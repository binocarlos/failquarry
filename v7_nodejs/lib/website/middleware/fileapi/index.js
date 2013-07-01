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
var async = require('async');
var eyes = require('eyes');
var url = require('url');
var fs = require('fs');

var ImageSizer = require('../../tools/imagesizer');

/*

  quarry.io - api middleware

  the HTTP to quarry protocol bridge
  
*/


module.exports = function(options, network){

  options || (options = {});

  var httproute = options.route;
  var warehouseroute = options.warehouse;
  var receptionfront = network.receptionfront;
  var warehouse = receptionfront.connect(warehouseroute || '/');
  
  var cache = '/tmp/quarry/cache/';
  
  return function(req, res, next){

    function dosizer(origpath){
      var size = req.query.size;

      if(size){
        ImageSizer({
          original:cachefile,
          size:req.query.size
        }, function(error, output){
          res.sendfile(output);
        })
      }
      else{
        res.sendfile(cachefile);
      }
    }

    var cachefile = cache + (req.path.replace(/^\//, '').replace(/\//g, '_'));
    /*
    
      check if we have a cached file (we don't know the contenttype yet)
      
    */
    fs.stat(cachefile, function(error, stat){
      if(!error && stat){
        dosizer(cachefile);
        return;
      }

      /*
      
        fetch the file from the backend warehouse in base64
        
      */
      var path = req.path.replace(/^\//, '');
      var parts = path.split(/\//);
      var department = parts.shift();
      path = '/' + parts.join('/');

      var contract = warehouse.api({
        query:req.query,
        url:path,
        method:req.method.toLowerCase(),
        headers:_.extend({}, req.headers, {
          "x-json-quarry-user":req.user,
          "x-quarry-department":department
        })
      })
      .expect('array')
      .title('REST request')
      .ship(function(answer, quarryres){

        var data = (quarryres.body || [])[0];

        if(!data || !data.attr || !data.attr.base64){
          res.statusCode = 404;
          res.send(req.url + ' not found');
        }
        else{
      
          fs.writeFile(cachefile, data.attr.base64, 'base64', function(error){
            dosizer(cachefile);
          })

        }
      })
    })
    
  }
}