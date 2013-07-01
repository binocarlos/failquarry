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
var fs = require('fs');
var url = require('url');
var ThreadServer = require('../../../threadserver/server');
/*

  quarry.io - scripts middleware

  enables server-side quarry scripts to run inside a thread server
  
*/


module.exports = function(options, network){

  options || (options = {});

  var io = network.io;
  var hq = network.hq;
  var receptionfront = network.receptionfront;
  var httproute = options.route;
  
  var script_root = options.script_root;
  
  var server = new ThreadServer({
    supplychain:receptionfront,
    codefolder:hq.attr('stack.corefolder')
  })

  return {
    mount:function(app, callback){

      app.use(httproute, function(req, res, next){

        var path = req.path;

        if(!path.match(/\.js$/)){
          path += '.js';
        }
        var script_file = script_root + path;

        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        eyes.inspect(script_file);

        fs.readFile(script_file, 'utf8', function(error, content){

          if(error || !content){
            res.statusCode = 404;
            res.send(error);
            return;
          }

          server.script({
            user:req.user,
            fn:content,
            req:{
              url:req.url,
              method:req.method,
              query:req.query,
              headers:req.headers,
              body:req.body
            }
          }, function(error, result){

            if(error){
              res.statusCode = 500;
              res.send(error);
              return;
            }
            else{

              var qres = result.res;

              if(_.isString(qres.body) && qres.body.indexOf('redirect:')==0){
                var location = qres.body.split(':')[1];
                res.redirect(location);
              }
              else{
                res.statusCode = qres.statusCode || 200;
                _.each(qres.headers, function(val, key){
                  res.setHeader(val, key);
                })
                res.send(qres.body);  
              }
            }
            
          })


        })


      })

      callback();
    }
  }

}